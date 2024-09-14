export function coupeLignes(texte:string):string
{
    let maxSignesLigne:number = 50;
    let progresTexte:number = 0;
    let decoupage:string[] = texte.split(" ");
    let nouvelleLigne:string = "";
    let retour:string = "";

    while (progresTexte < decoupage.length+1)
    {
        let nouveauMot:string = decoupage[progresTexte];
        if (progresTexte == decoupage.length)
        {
            retour += nouvelleLigne;
            progresTexte++;
        }
        else if (nouvelleLigne.length + nouveauMot.length +1 < maxSignesLigne)
        {
            nouvelleLigne += " "+nouveauMot;
            progresTexte++;
        }
        else
        {
            retour += nouvelleLigne + "\n";
            nouvelleLigne = "";
        }
    }
    return retour;
}