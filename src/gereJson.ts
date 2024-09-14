import { ChangeEvent, MouseEventHandler } from "react";
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


var scene:Scene;
var nomScene:string;

export async function handleChange(event:ChangeEvent<HTMLInputElement>) {
  const reader = new FileReader()
  reader.onload = async (e) => { 
    const result = e.target?.result;
    if (typeof result === "string")
    {
      scene = JSON.parse(result);
      createSceneNodes(scene);
    }
  };
  if (event.target.files)
  {
    nomScene = event.target.value.substring(12);
    reader.readAsText(event.target.files[0])
  }
}

export function sauveJson()
{
    const file = new Blob([JSON.stringify(scene)], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = nomScene;
    link.click();
    URL.revokeObjectURL(link.href);
}
