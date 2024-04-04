import { ChangeEvent } from "react";
import { createSceneNodes } from "./rete/default";

export interface ValeurTexte{
  intitule:string;
  comportement:number;
  politesse:number;
}

export interface InfosNode{
  index:number;
  x:number;
  y:number;
}

export interface Reponse extends ValeurTexte, InfosNode {
  suite:string;
}

export interface IndexReponse{
  indexReponse:number;
  indexLocal:number;
  nombreChoix:number;
}

export interface Question extends InfosNode{
  nom:string;
  question:ValeurTexte;
  reponses:IndexReponse[];
}

export interface Scene{
  questions:Question[];
  reponses:Reponse[];
}

async function handleChange(event:ChangeEvent<HTMLInputElement>) {
  const reader = new FileReader()
  reader.onload = async (e) => { 
    const result = e.target?.result;
    if (typeof result === "string")
    {
      let scene:Scene = JSON.parse(result);
      createSceneNodes(scene);
    }
  };
  if (event.target.files)
  {
    reader.readAsText(event.target.files[0])
  }
}

export { handleChange }
