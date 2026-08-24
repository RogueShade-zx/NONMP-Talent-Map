const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 1
});

map.setView([0, 0], 0);

const bounds = [[-2000, -2000], [2000, 2000]];
const maxBounds = [[-1500, -2000], [1250, 2500]];

map.setMaxBounds(maxBounds);

// https://stackoverflow.com/questions/33767463/overlaying-a-text-box-on-a-leaflet-js-map
let textbox = L.Control.extend({
    onAdd: function() {

        var text = L.DomUtil.create('div');
        text.id = "info_text";
        text.link = "https://store.steampowered.com/app/3942480/The_NOexistenceN_of_Morphean_Paradox__The_Forest_of_Silver_Shallots";
        text.innerHTML = "<h2>" + 
        `<a href='"+$(text.link)+"'>The NOexistenceN of Morphean Paradox: The Forest of Silver Shallots</a>` +
        " is property of Nino Games" +
        "</h2>"
        return text;
    },
});

new textbox({ position: 'bottomright'}).addTo(map);

const SVG_NS = "http://www.w3.org/2000/svg";

let activePopup = null;
let activePopup2 = null;
let activeHighlight = false;
let duplicatePopup = false;

const svg = document.createElementNS(SVG_NS, "svg");
svg.setAttribute("xmlns", SVG_NS);
svg.setAttribute("viewBox", "0 0 4000 4000");
const svgOverlay = L.svgOverlay(svg, bounds, {interactive: true});
svgOverlay.addTo(map);

const lineLayer = document.createElementNS(SVG_NS, "g");
lineLayer.setAttribute("id", "line-layer");
svg.append(lineLayer);
lineLayer.style.display = "none";

const highlightLayer = document.createElementNS(SVG_NS, "g");
highlightLayer.setAttribute("id", "highlight-layer");
svg.append(highlightLayer);

const nodeLayer = document.createElementNS(SVG_NS, "g");
nodeLayer.setAttribute("id", "node-layer");
svg.append(nodeLayer);

const characterLayers = {}
const Morphean_Paradox = createCharacterLayer("Morphean Paradox")
const Lilith = createCharacterLayer("Lilith");
const Sartre = createCharacterLayer("Sartre");
const Fouco = createCharacterLayer("Fouco");
const Kallen = createCharacterLayer("Kallen");
const Green = createCharacterLayer("Green");

const popupLayer = document.createElementNS(SVG_NS, "g");
popupLayer.setAttribute("id", "popup-layer");
svg.append(popupLayer);

svg.addEventListener("click", () => {
    console.log("svg clicked");
});

function gameToSvgX(x) {
    return 2000 + x;
}

function gameToSvgY(y) {
    return 2000 - y;
}

function createCharacterLayer(character) {
    const characterLayer = document.createElementNS(SVG_NS, "g");
    characterLayer.setAttribute("id", character);

    nodeLayer.appendChild(characterLayer);
    characterLayers[character] = characterLayer;

    characterLayer.style.display = "none";

    return characterLayer;
}

function showCharacterLayer(name) {
    for (const character in characterLayers) {
        characterLayers[character].style.display = "none";
    }
    removePopup();

    characterLayers[name].style.display = "block";
}

function highlight(node) {
    if (activeHighlight) activeHighlight.remove();
    
    const highlightSize = (node.type == "Common") ? 95 : 45;
    const nodeX = gameToSvgX(node.x);
    const nodeY = gameToSvgY(node.y);

    const highlight = document.createElementNS(SVG_NS, "image");
    highlight.setAttribute("href", "images\\Highlight.png");
    highlight.setAttribute("width", highlightSize);
    highlight.setAttribute("height", highlightSize);
    highlight.setAttribute("x", nodeX - highlightSize/2);
    highlight.setAttribute("y", nodeY - highlightSize/2);

    activeHighlight = highlight;

    highlightLayer.appendChild(activeHighlight);
}

function popup(node) {
    const nodeX = gameToSvgX(node.x);
    const nodeY = gameToSvgY(node.y);
    const gap = (node.type == "Common") ? "<br>" : "";
    const lock = (node.state == "Locked") ? "Not unlockable in current game version." : "";

    let popup = document.createElementNS(SVG_NS, "foreignObject");
    popup.setAttribute("id", "popup");
    popup.setAttribute("width", "500");
    popup.setAttribute("x", nodeX);
    popup.setAttribute("y", nodeY);
    //popup.style.backgroundColor = "#21313b";
    popup.innerHTML = `<h2>${node.name}<hr></h2>
                        <p>${gap} ${node.Desc} <br></p>
                        <p>${node.NumericDesc} <br><br></p>
                        <p>${node.Story} </p>
                        <p>${lock}`;
    
    let popup2 = document.createElementNS(SVG_NS, "foreignObject");

    popup2.setAttribute("id", "cost-popup");
    popup2.setAttribute("width", "150");
    popup2.setAttribute("x", nodeX + 510);
    popup2.setAttribute("y", nodeY);

    var innerHTML = `<h2>Costs<hr></h2>`;
    
    if(node.lvl1cost != "") innerHTML += `<h3> Level 1 </h3> <p> ${node.lvl1cost} </p>`;
    if(node.lvl2cost != "") innerHTML += `<h3> Level 2 </h3> <p> ${node.lvl2cost} </p>`;
    if(node.lvl3cost != "") innerHTML += `<h3> Level 3 </h3> <p> ${node.lvl3cost} </p>`;

    popup2.innerHTML = innerHTML;

    if (activePopup && (activePopup.innerHTML == popup.innerHTML)) duplicatePopup = true;

    removePopup();

    if (!duplicatePopup) {
        activePopup = popup;
        activePopup2 = popup2;
        popupLayer.appendChild(activePopup);
        const height = document.getElementById("popup").innerHTML.length;

        popup.setAttribute("height", height/1.55);
        if (node.lvl1cost != "") {
            popupLayer.appendChild(activePopup2);
            const height2 = document.getElementById("cost-popup").innerHTML.length;                
            
            node.type == "Common" ? popup2.setAttribute("height", 20 + height2/1.25) : popup2.setAttribute("height", 10 + height2);
        }
        popupLayer.appendChild(activePopup);
    } else duplicatePopup = false;
}

function removePopup() {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
        activePopup2.remove();
        activePopup2 = null;
    }
}

function renderNode(node, character) {
    const group = document.createElementNS(SVG_NS, "g");

    const nodeSize = (node.type == "Common") ? 70 : 30;
    const skillSize = nodeSize / 1.4;

    const nodeX = gameToSvgX(node.x);
    const nodeY = gameToSvgY(node.y);

    const nodeImage = document.createElementNS(SVG_NS, "image");
    nodeImage.setAttribute("href", (node.type == "Common") ? "images\\Common Node.png" : "images\\Attribute Node.png");
    nodeImage.setAttribute("height", nodeSize);
    nodeImage.setAttribute("width", nodeSize);
    nodeImage.setAttribute("x", gameToSvgX(node.x) - nodeSize/2);
    nodeImage.setAttribute("y", gameToSvgY(node.y) - nodeSize/2);

    const skillImage = document.createElementNS(SVG_NS, "image");
    skillImage.setAttribute("href", (node.type == "Common") ? `images\\skills\\${node.image}` : `images\\attribute\\${node.image}`);
    skillImage.setAttribute("height", skillSize);
    skillImage.setAttribute("width", skillSize);
    skillImage.setAttribute("x", nodeX - skillSize/2);
    skillImage.setAttribute("y", nodeY - skillSize/2);

    group.appendChild(nodeImage);
    group.appendChild(skillImage);

    if (node.state == "Locked") {
        const lockSize = skillSize / 2;

        const lockImage = document.createElementNS(SVG_NS, "image");
        lockImage.setAttribute("href", "images\\Lock.png");
        lockImage.setAttribute("width", lockSize);
        lockImage.setAttribute("height", lockSize);
        lockImage.setAttribute("x", gameToSvgX(node.x) - lockSize/2)
        lockImage.setAttribute("y", gameToSvgY(node.y) - lockSize/2)

        group.appendChild(lockImage);
    }

    group.addEventListener("mouseover", () => highlight(node));
    group.addEventListener("mouseleave", () => activeHighlight.style.display = "none");
    group.addEventListener("click", () => {
        console.log("node clicked:", node.name);
        popup(node);
    });

    character.appendChild(group);
}

function renderLine(line) {
    const xStart = gameToSvgX(line.xStart).toFixed(2);
    const yStart = gameToSvgY(line.yStart).toFixed(2);
    const xControl = gameToSvgX(line.xControl).toFixed(2);
    const yControl = gameToSvgY(line.yControl).toFixed(2);
    const xEnd = gameToSvgX(line.xEnd).toFixed(2);
    const yEnd = gameToSvgY(line.yEnd).toFixed(2);

    const path = document.createElementNS(SVG_NS, "path");

    path.setAttribute("stroke", "#507388");
    path.setAttribute("stroke-width", line.thickness)
    path.setAttribute("fill", "none")
    path.setAttribute("d", `M ${xStart},${yStart} 
                            Q ${xControl},${yControl} 
                            ${xEnd},${yEnd}`);

    lineLayer.appendChild(path);
}

const centerX = 45;
const centerY = -25;

function renderCenter() {
    const size = 435;

    const image = document.createElementNS(SVG_NS, "image");
    image.setAttribute("href", "images\\center\\Center.png");
    image.setAttribute("width", size);
    image.setAttribute("height", size);

    image.setAttribute("x", gameToSvgX(centerX) - size/2);
    image.setAttribute("y", gameToSvgY(centerY) - size/2);

    lineLayer.appendChild(image);
}

function renderTotems() {
    const size = 105;

    for (const character in characterLayers) {
        const image = document.createElementNS(SVG_NS, "image");
        const imagePath = `images\\center\\${character} Totem.png`

        image.setAttribute("href", imagePath);
        image.setAttribute("width", size);
        image.setAttribute("height", size);
        image.setAttribute("x", gameToSvgX(centerX) - size/2);
        image.setAttribute("y", gameToSvgY(centerY) - size/2);
        
        characterLayers[character].appendChild(image);
    }
}

fetch("data\\lines.json")
    .then(response => response.json())
    .then(data => {
        data.lines.forEach(line => {
            renderLine(line);
        });
    });

fetch("data\\You.json")
    .then(response => response.json())
    .then(data => {
        data.nodes.forEach(node => {
            renderNode(node, Morphean_Paradox);
        });
    });

fetch("data\\Lilith.json")
    .then(response => response.json())
    .then(data => {
        data.nodes.forEach(node => {
            renderNode(node, Lilith);
        });
    });

fetch("data\\Sartre.json")
    .then(response => response.json())
    .then(data => {
        data.nodes.forEach(node => {
            renderNode(node, Sartre);
        });
    });

fetch("data\\Fouco.json")
    .then(response => response.json())
    .then(data => {
        data.nodes.forEach(node => {
            renderNode(node, Fouco);
        });
    });

fetch("data\\Karen Scarlett.json")
    .then(response => response.json())
    .then(data => {
        data.nodes.forEach(node => {
            renderNode(node, Kallen);
        });
    });

fetch("data\\Green Roland.json")
    .then(response => response.json())
    .then(data => {
        data.nodes.forEach(node => {
            renderNode(node, Green);
        });
    });
    
renderTotems();
renderCenter();

document.querySelectorAll("#character-buttons button").forEach(button => {
    button.addEventListener("click", () => {
        lineLayer.style.display = "block";
        
        showCharacterLayer(button.dataset.character);
    });
});




