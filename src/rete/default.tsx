import { ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete';

import { Area2D, AreaPlugin } from 'rete-area-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';
import {
  ReactPlugin,
  ReactArea2D,
  Presets as ReactPresets,
} from 'rete-react-plugin';
import { createRoot } from 'react-dom/client';
import { 
  ValeurTexte, Reponse, Question, Scene 
} from '../gereJson';
import { ChangeEvent, useState } from 'react';
import { Position } from 'rete-area-plugin/_types/types';

class NodeRobote extends Classic.Node<
  { [key in string]: Classic.Socket },
  { [key in string]: Classic.Socket },
  {
    [key in string]:
      | TextAreaControl
      | Classic.Control
      | Classic.InputControl<"number">
      | Classic.InputControl<"text">;
  }
> {}

type Node = QuestionNode | AnswerNode;
type Conn =
  | Connection<QuestionNode, AnswerNode>
  | Connection<AnswerNode, QuestionNode>;

type Schemes = GetSchemes<Node, Conn>;

class Connection<A extends NodeRobote, B extends NodeRobote> extends Classic.Connection<
  A,
  B
> {}

class TextAreaControl extends Classic.Control {
  constructor(public valeurs:ValeurTexte){
    super();
  }
}

function CustomTextArea(props : {data : TextAreaControl})
{
  const [value, setValue] = useState(props.data.valeurs.intitule);

  const modifValeur = (e:ChangeEvent<HTMLTextAreaElement>) => {
    props.data.valeurs.intitule = e.target.value;
    setValue(e.target.value);
  };

  return (
    <textarea 
      className="replique"
      value={value}
      onChange={ modifValeur }
    />
  );
}

class BaseNode extends NodeRobote {
  width = 200;
  height = 400;

  public positionInitiale:boolean = false;

  constructor(titre:string){
    super(titre);
  }

  addBaseControls(valeurs:ValeurTexte) : void
  {
    
    let controleIntitule = new TextAreaControl(valeurs);
    controleIntitule.index = 0;
    this.addControl(
      "textIntitule",
      controleIntitule);

    let controleComportement = new Classic.InputControl("number", { initial:valeurs.comportement, change(value){
                                                                                  valeurs.comportement = value}}
    );
    controleComportement.index = 1;
    this.addControl(
      "numberComportement",
      controleComportement
    );

    let controlePolitesse = new Classic.InputControl("number", { initial:valeurs.politesse, change(value){
                                                                              valeurs.politesse = value} });
    controlePolitesse.index = 2;
    this.addControl(
      "numberPolitesse",
      controlePolitesse
    );

    let inputSocket = new Classic.Input(socket, 'Input', true);
    inputSocket.index = 3;
    this.addInput("input", inputSocket);
  }
} 

class QuestionNode extends BaseNode{
  source:Question;

  constructor(src:Question = {index:0, x:0, y:0, nom:"", 
                              question:{intitule:"", comportement:0,politesse:0},
                              reponses:[]}){
    super(src.nom);
    
    this.source = src;
    this.addBaseControls(this.source.question);
  }
}

class AnswerNode extends BaseNode{
  source:Reponse;

  constructor(src:Reponse = {index:0, x:0, y:0, intitule:"", 
                            comportement:0,politesse:0,suite:""}){
    super("Reponse");
    
    this.source = src;
    this.addBaseControls(this.source as ValeurTexte);
    this.addOutput("suite", new Classic.Output(socket, "Suite"));
  }
}

type AreaExtra = Area2D<Schemes> | ReactArea2D<Schemes>;

const socket = new Classic.Socket('socket');

var editor:NodeEditor<Schemes>;
var area:AreaPlugin<Schemes, AreaExtra>;

export async function createEditor(container: HTMLElement) {
  editor = new NodeEditor<Schemes>();
  area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const reactRender = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

  editor.use(area);

  area.use(reactRender);
  area.use(connection);

  connection.addPreset(ConnectionPresets.classic.setup());
  reactRender.addPreset(ReactPresets.classic.setup({
    customize: {
      control(data) {
        if (data.payload instanceof TextAreaControl) {
          return CustomTextArea;
        }
        if (data.payload instanceof Classic.InputControl) {
          return ReactPresets.classic.Control;
        }
        return null;
      }
    }
  }));

  return {
    destroy: () => area.destroy(),
  };
}

var questionNodes:QuestionNode[];
var reponseNodes:AnswerNode[];

export async function createSceneNodes(scene:Scene)
{
  questionNodes = [];
  reponseNodes = [];
  scene.questions.forEach(async (question:Question) => {
    let questionNode = new QuestionNode(question);
    questionNodes.push(questionNode);
    await editor.addNode(questionNode);
    await area.nodeViews.get(questionNode.id)?.translate(question.x, question.y);
    questionNode.positionInitiale = true;
  });

  scene.reponses.forEach(async (reponse:Reponse) =>{
    let reponseNode = new AnswerNode(reponse);
    reponseNodes.push(reponseNode);
    await editor.addNode(reponseNode);
    await area.nodeViews.get(reponseNode.id)?.translate(reponse.x, reponse.y);
    reponseNode.positionInitiale = true;
  });
  createConnections();
  createEvents();
}

async function createConnections()
{
  questionNodes.forEach(async (questionNode) =>{
    questionNode.source.reponses.forEach(async (indexReponse) =>{
      let reponseNode = trouveUnNodeReponse(indexReponse.indexReponse);
      let indexOutput = (indexReponse.indexLocal +1).toString();
      let outputSocket = new Classic.Output(socket, indexOutput);
      outputSocket.index = indexReponse.indexLocal + 4;
      questionNode.addOutput(indexOutput, outputSocket);
      await editor.addConnection(new Connection(questionNode, indexOutput,
                                 reponseNode as Node, 'input'));
    });
  });
  connecteReponses();
}

async function connecteReponses()
{
  reponseNodes.forEach(async (reponseNode) =>{
    if (reponseNode.source.suite)
    {
      let questionNode = trouveUnNodeQuestion(reponseNode.source.suite);
      await editor.addConnection(new Connection(reponseNode, "suite",
                                questionNode as Node, 'input'));
    }
  });
}

function createEvents()
{
  area.addPipe(context => {
    if (context.type === 'nodetranslate')
      {
        modifieCoordonneesNode(context.data.id, context.data.position);
      }
    return context
  })
}

function modifieCoordonneesNode(id:string, pos:Position)
{
  let n:Node = editor.getNode(id);
  if (n.positionInitiale)
  {
    n.source.x = pos.x;
    n.source.y = pos.y;
  }
 
}

function trouveUnNodeReponse(index:number):AnswerNode
{
    let retour:AnswerNode = new AnswerNode();
    for (let i = 0;i<reponseNodes.length;i++)
    {
        let reponse = reponseNodes[i];
        if (reponse.source.index === index)
        {
            retour = reponse;
            break;
        }
    }
    return retour;
}

function trouveUnNodeQuestion(nom:string):QuestionNode
{
    let retour:QuestionNode = new QuestionNode();
    for (let i = 0;i<questionNodes.length;i++)
    {
        let question = questionNodes[i];
        if (question.source.nom === nom)
        {
            retour = question;
            break;
        }
    }
    return retour;
}


