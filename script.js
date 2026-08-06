let html5QrCode = null;
let livreEnCours = null;
let indexLivre = -1;
let indexEdition = -1;
let modeEdition = false;

function ouvrirBibliotheque(){

    afficherBibliotheque();

    document.getElementById("libraryPopup").style.display = "flex";

}

async function ouvrirScanner() {

    document.getElementById("scannerPage").style.display = "block";

    html5QrCode = new Html5Qrcode("camera");

    try {

        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: 250
            },
            async (isbn) => {

                await html5QrCode.stop();

                document.getElementById("scannerPage").style.display = "none";

                setTimeout(() => {
                    rechercherLivre(isbn);
                 }, 300);
            }
        );

    } catch {

        alert("Impossible d'ouvrir la caméra.");

    }
}

async function rechercherLivre(isbn){

    try{

        const reponse = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
        );

        const donnees = await reponse.json();
        const livre = donnees[`ISBN:${isbn}`];

        // ---------- Livre introuvable ----------
        if(!livre){

            livreEnCours = {
                isbn,
                titre: "",
                auteur: ""
            };

            document.getElementById("bookTitle").textContent = "Livre introuvable";
            document.getElementById("bookAuthor").textContent = "";

            document.getElementById("manualFields").style.display = "flex";
            document.getElementById("manualTitle").value = "";
            document.getElementById("manualAuthor").value = "";

            document.getElementById("bookStatus").textContent = "";
            document.getElementById("addBookBtn").style.display = "block";
            document.getElementById("deleteBookBtn").style.display = "none";

            document.getElementById("bookPopup").style.display = "flex";

            return;
        }

        // ---------- Livre trouvé ----------
        livreEnCours = {
            isbn,
            titre: livre.title,
            auteur: livre.authors
                ? livre.authors.map(a => a.name).join(", ")
                : "Auteur inconnu"
        };

        document.getElementById("manualFields").style.display = "none";

        document.getElementById("bookTitle").textContent = livreEnCours.titre;
        document.getElementById("bookAuthor").textContent = livreEnCours.auteur;

        document.getElementById("bookStatus").textContent = "";
        document.getElementById("addBookBtn").style.display = "block";
        document.getElementById("deleteBookBtn").style.display = "none";

        document.getElementById("bookPopup").style.display = "flex";

    }catch{

        // ---------- Erreur réseau ----------
        livreEnCours = {
            isbn,
            titre: "",
            auteur: ""
        };

        document.getElementById("bookTitle").textContent = "Connexion impossible";
        document.getElementById("bookAuthor").textContent = "";

        document.getElementById("manualFields").style.display = "flex";
        document.getElementById("manualTitle").value = "";
        document.getElementById("manualAuthor").value = "";

        document.getElementById("bookStatus").textContent = "";
        document.getElementById("addBookBtn").style.display = "block";
        document.getElementById("deleteBookBtn").style.display = "none";

        document.getElementById("bookPopup").style.display = "flex";

    }

            }

function fermerScanner(){

    if(html5QrCode){
        html5QrCode.stop().catch(()=>{});
    }

    document.getElementById("scannerPage").style.display="none";
}

document.getElementById("addBookBtn").onclick = function(){

    if(document.getElementById("manualFields").style.display === "flex"){

        livreEnCours.titre =
            document.getElementById("manualTitle").value.trim();

        livreEnCours.auteur =
            document.getElementById("manualAuthor").value.trim();

        if(livreEnCours.titre === ""){

            document.getElementById("bookStatus").style.color = "#e53935";
            document.getElementById("bookStatus").textContent =
                "Veuillez saisir un titre.";

            return;
        }

        if(livreEnCours.auteur === ""){
            livreEnCours.auteur = "Auteur inconnu";
        }
    }

    let bibliotheque =
        JSON.parse(localStorage.getItem("bibliotheque") || "[]");

    const status = document.getElementById("bookStatus");

    // Vérification des doublons
    const doublon = bibliotheque.some((livre, i) => {

        if(indexEdition !== -1 && i === indexEdition){
            return false;
        }

        return livre.isbn === livreEnCours.isbn;

    });

    if(doublon){

        status.style.color = "#e53935";
        status.textContent = "❌ Ce livre est déjà dans la bibliothèque";
        return;
    }

    if(indexEdition === -1){

        bibliotheque.push(livreEnCours);

    }else{

        bibliotheque[indexEdition] = livreEnCours;
        indexEdition = -1;

    }

    localStorage.setItem(
        "bibliotheque",
        JSON.stringify(bibliotheque)
    );

    afficherBibliotheque();

    fermerBookPopup();

};
    

function importerBibliotheque(){

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = function(e){
        const fichier = e.target.files[0];
        if(!fichier) return;
        const lecteur = new FileReader();
        lecteur.onload = function(ev){
            try{
                const bibliotheque = JSON.parse(ev.target.result);
                localStorage.setItem("bibliotheque", JSON.stringify(bibliotheque));
                afficherBibliotheque();
                ouvrirImportPopup();
            }catch(err){
                console.error(err);
                alert("Fichier invalide");
            }
        };
        lecteur.readAsText(fichier);
    };

    input.click();
}

function exporterBibliotheque(){

    const bibliotheque = JSON.parse(
        localStorage.getItem("bibliotheque") || "[]"
    );

    const fichier = new Blob(
        [JSON.stringify(bibliotheque, null, 2)],
        { type: "application/json" }
    );

    const lien = document.createElement("a");

    lien.href = URL.createObjectURL(fichier);
    lien.download = `bibliotheque_${new Date().toISOString().slice(0,10)}.json`;

    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);

    URL.revokeObjectURL(lien.href);

}

function fermerBookPopup(){

    document.getElementById("bookPopup").style.display = "none";
    document.getElementById("bookStatus").textContent = "";
    document.getElementById("addBookBtn").style.display = "block";
    document.getElementById("addBookBtn").textContent = "Ajouter";
    document.getElementById("deleteBookBtn").style.display = "none";
    document.getElementById("manualFields").style.display = "none";
    document.getElementById("manualTitle").value = "";
    document.getElementById("manualAuthor").value = "";
    document.getElementById("bookAuthor").style.display = "block";

}

function ouvrirImportPopup() {

    document.getElementById("importPopup").style.display = "flex";
}

function fermerImportPopup() {

    document.getElementById("importPopup").style.display = "none";
}


function fermerBibliotheque() {

    document.getElementById("libraryPopup").style.display = "none";

    document.getElementById("searchBook").value = "";
    filtrerBibliotheque();

    fermerBookPopup();

}

function afficherBibliotheque(){

    const liste = document.getElementById("libraryList");

    liste.innerHTML = "";

    const bibliotheque =
        JSON.parse(localStorage.getItem("bibliotheque") || "[]");

    bibliotheque.forEach((livre,index)=>{

        const couleur = index % 2 === 0 ? "green" : "orange";

        liste.innerHTML += `
            <div class="book-item" onclick="ouvrirLivre(${index})">

                <div class="book-dot ${couleur}"></div>

                <div class="book-info">
    <div class="book-name">${livre.titre}</div>
    <div class="book-author">${livre.auteur}</div>
</div>

<div class="book-actions">
    <div class="book-menu" onclick="ouvrirMenuLivre(event, ${index})">
        ⋮
    </div>
</div>

            </div>
        `;

    });

}

function filtrerBibliotheque() {

    const recherche = document
        .getElementById("searchBook")
        .value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const livres = document.querySelectorAll(".book-item");

    let trouve = false;

    livres.forEach(livre => {

        const texte = livre.textContent
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (texte.includes(recherche)) {
            livre.style.display = "flex";
            trouve = true;
        } else {
            livre.style.display = "none";
        }

    });

    let message = document.getElementById("noResult");

    if (!message) {
        message = document.createElement("div");
        message.id = "noResult";
        message.style.textAlign = "center";
        message.style.color = "#777";
        message.style.marginTop = "30px";
        message.textContent = "Aucun livre trouvé";
        document.getElementById("libraryList").appendChild(message);
    }

    message.style.display = trouve ? "none" : "block";

}


function ouvrirLivre(index){

if (document.getElementById("libraryPopup").style.display !== "flex") {
    return;
}
    
    const bibliotheque = JSON.parse(
        localStorage.getItem("bibliotheque") || "[]"
    );

    const livre = bibliotheque[index];

indexLivre = index;

document.getElementById("bookTitle").textContent = livre.titre;
document.getElementById("bookAuthor").textContent = livre.auteur;

document.getElementById("bookStatus").textContent = "";

document.getElementById("addBookBtn").style.display = "none";
document.getElementById("deleteBookBtn").style.display = "block";

document.getElementById("bookPopup").style.display = "flex";

document.getElementById("deleteBookBtn").onclick = function(){

    let bibliotheque = JSON.parse(
        localStorage.getItem("bibliotheque") || "[]"
    );

    bibliotheque.splice(indexLivre,1);

    localStorage.setItem(
        "bibliotheque",
        JSON.stringify(bibliotheque)
    );

    fermerBookPopup();

    afficherBibliotheque();

};
}

function modifierLivre(index){

    alert("Début");

    const bibliotheque = JSON.parse(
        localStorage.getItem("bibliotheque") || "[]"
    );

    const livre = bibliotheque[index];

    alert("Livre chargé");

    document.getElementById("bookTitle").textContent = "Modifier le livre";

    document.getElementById("bookAuthor").style.display = "none";
    
    document.getElementById("manualFields").style.display = "flex";

    document.getElementById("manualTitle").value = livre.titre;

    document.getElementById("manualAuthor").value = livre.auteur;

    document.getElementById("addBookBtn").textContent = "Enregistrer";
    
    document.getElementById("bookPopup").style.display = "flex";

    alert("Popup affiché");

}


function supprimerLivre(event, index){

    event.stopPropagation();

    if(!confirm("Supprimer ce livre ?")){
        return;
    }

    let bibliotheque = JSON.parse(
        localStorage.getItem("bibliotheque") || "[]"
    );

    bibliotheque.splice(index, 1);

    localStorage.setItem(
        "bibliotheque",
        JSON.stringify(bibliotheque)
    );

    afficherBibliotheque();
}

let livreASupprimer = -1;

function ouvrirSuppression(event, index){

    event.stopPropagation();

    livreASupprimer = index;

    document.getElementById("deletePopup").style.display = "flex";

}

document.getElementById("cancelDeleteBtn").onclick = function(){

    document.getElementById("deletePopup").style.display = "none";

};

document.getElementById("confirmDeleteBtn").onclick = function(){

    let bibliotheque = JSON.parse(
        localStorage.getItem("bibliotheque") || "[]"
    );

    bibliotheque.splice(livreASupprimer,1);

    localStorage.setItem(
        "bibliotheque",
        JSON.stringify(bibliotheque)
    );

    document.getElementById("deletePopup").style.display = "none";

    afficherBibliotheque();

};

document.querySelectorAll(".card, .list-card").forEach(element => {

    element.addEventListener("touchstart", () => {
        element.classList.add("pressed");
    });

    element.addEventListener("touchend", () => {
        element.classList.remove("pressed");
    });

    element.addEventListener("touchcancel", () => {
        element.classList.remove("pressed");
    });

});

let livreSelectionne = -1;

function ouvrirMenuLivre(event, index){

    event.stopPropagation();

    livreSelectionne = index;

    document.getElementById("bookMenuPopup").style.display = "flex";

}

document.getElementById("cancelMenuBtn").onclick = function(){

    document.getElementById("bookMenuPopup").style.display = "none";

    livreSelectionne = -1;

};


document.getElementById("menuDeleteBtn").onclick = function(){

    document.getElementById("bookMenuPopup").style.display = "none";

    ouvrirSuppression(
        { stopPropagation(){} },
        livreSelectionne
    );

};

document.getElementById("editBookBtn").onclick = function(){

    modeEdition = true;

    document.getElementById("bookMenuPopup").style.display = "none";

    modifierLivre(livreSelectionne);

};
