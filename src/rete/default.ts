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
} from '../gereJson'

type Node = QuestionNode | AnswerNode;
type Conn =
  | Connection<QuestionNode, AnswerNode>
  | Connection<AnswerNode, QuestionNode>;

type Schemes = GetSchemes<Node, Conn>;

class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> {}

class BaseNode extends Classic.Node {
  width = 200;
  height = 350;

  constructor(titre:string){
    super(titre);
  }

  addBaseControls(valeurs:ValeurTexte) : void
  {
    this.addIntitule(valeurs.intitule);
    this.addComportement(valeurs.comportement);
    this.addPolitesse(valeurs.politesse);

    this.addInput("input", new Classic.Input(socket, 'Input', true));
  }

  addIntitule(initial:string) : void
  {
    this.addControl(
      "textIntitule",
      new Classic.InputControl("text", { initial })
    );
  }

  addComportement(initial:number) : void
  {
    this.addControl(
      "numberComportement",
      new Classic.InputControl("number", { initial })
    );
  }

  addPolitesse(initial:number) : void
  {
    this.addControl(
      "numberPolitesse",
      new Classic.InputControl("number", { initial })
    );
  }
} 

class QuestionNode extends BaseNode{
  source:Question;

  constructor(src:Question){
    super(src.nom);
    
    this.source = src;
    this.addBaseControls(this.source.question);
  }
}

class AnswerNode extends BaseNode{
  source:Reponse;

  constructor(src:Reponse){
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
  reactRender.addPreset(ReactPresets.classic.setup());

  /*const a = new NumberNode(1);
  const b = new NumberNode(1);
  const c = new NumberNode(10);
  const add = new AddNode();

  await editor.addNode(a);
  await editor.addNode(b);
  await editor.addNode(c);
  await editor.addNode(add);

  await editor.addConnection(new Connection(a, 'value', add, 'a'));
  await editor.addConnection(new Connection(b, 'value', add, 'b'));
  await editor.addConnection(new Connection(c, 'value', add, 'c'));

  await area.nodeViews.get(a.id)?.translate(100, 100);
  await area.nodeViews.get(b.id)?.translate(100, 300);
  await area.nodeViews.get(c.id)?.translate(100, 500);
  await area.nodeViews.get(add.id)?.translate(400, 150);*/

  return {
    destroy: () => area.destroy(),
  };
}

var scene:Scene;
var questionNodes:QuestionNode[];
var reponseNodes:AnswerNode[];

export async function createSceneNodes(scn:Scene)
{
  scene = scn;
  questionNodes = [];
  reponseNodes = [];
  scene.questions.forEach(async (question:Question) => {
    let questionNode = new QuestionNode(question);
    questionNodes.push(questionNode);
    await editor.addNode(questionNode);
    await area.nodeViews.get(questionNode.id)?.translate(question.x, question.y);
  });

  scene.reponses.forEach(async (reponse:Reponse) =>{
    let reponseNode = new AnswerNode(reponse);
    reponseNodes.push(reponseNode);
    await editor.addNode(reponseNode);
    await area.nodeViews.get(reponseNode.id)?.translate(reponse.x, reponse.y);
  });
  createConnections();
}

async function createConnections()
{
  questionNodes.forEach(async (questionNode) =>{
    questionNode.source.reponses.forEach(async (indexReponse) =>{
      let reponseNode = trouveUnNodeReponse(indexReponse.indexReponse);
      let indexOutput = indexReponse.indexLocal.toString();
      questionNode.addOutput(indexOutput, new Classic.Output(socket, indexOutput));
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

function trouveUnNodeReponse(index:number)
{
    let retour = null;
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

function trouveUnNodeQuestion(nom:string)
{
    let retour = null;
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


