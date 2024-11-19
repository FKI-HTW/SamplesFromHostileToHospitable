export class UI_Injector {
    private static instance: UI_Injector;
    private rootElement: HTMLElement | null = document.getElementById('app');
    private buttons: Map<string, HTMLElement> = new Map();
    private lastClickedButton!: HTMLButtonElement;

    private allCreatedElements: HTMLElement[] = []; // Eine Liste (Array) vom Typ HTMLElement

    private startButton : HTMLElement | undefined;
   
    private constructor() {}

    public static getInstance(): UI_Injector {
        if (!UI_Injector.instance) {
            UI_Injector.instance = new UI_Injector();
        }
        return UI_Injector.instance;
    }

    public createImage(imageUrl: string, scale: number, left: string, top: string): void {
        // Erstellen eines neuen <img>-Elements
        const img = document.createElement("img");
        img.src = imageUrl; // Bildquelle setzen
    
        // Warten, bis das Bild geladen ist, um seine Originalgröße zu kennen
        img.onload = () => {
            // Skalierte Größe des Bildes setzen
            img.style.width = `${img.naturalWidth * scale}px`;
            img.style.height = `${img.naturalHeight * scale}px`;
    
            // Position setzen (z. B. "50px", "10%")
            img.style.position = "absolute";
            img.style.left = left;
            img.style.top = top;
    
            // Bild dem UI-Container hinzufügen (z. B. ein übergeordnetes HTML-Element)
            const uiContainer = document.getElementById("ui-container");
            if (uiContainer) {
                uiContainer.appendChild(img);
            } else {
                console.error("UI-Container mit ID 'ui-container' nicht gefunden.");
            }
        };
    
        img.onerror = () => {
            console.error(`Bild konnte nicht geladen werden: ${imageUrl}`);
        };
    }
    
    public createButton(id: string, buttonText: string, onClickCallback: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = buttonText; // Setzt den Text des Buttons
        button.style.position = 'absolute';
        button.style.cursor = 'pointer';
        button.addEventListener('click', onClickCallback);
        this.rootElement!.prepend(button);
        this.buttons.set(id, button);
        this.allCreatedElements.push(button);
        return button;
    }

    public removeButtonById(id: string) {
        console.log(id);
        const button = this.buttons.get(id);
        if (button) {
            button.remove(); // Entfernt den Button aus dem DOM
            this.buttons.delete(id); // Entfernt die Referenz aus der Map
        }
    }

    public createImageButton(imageUrl: string, onClickCallback: () => void, customClass?: string): HTMLButtonElement {
        // Erstellen eines neuen Buttons
        const button = document.createElement('button');
        // Hinzufügen der ID und Klasse zum Button
        button.classList.add('imageButton');
        if (customClass) {
            button.classList.add(customClass);
        }
    
        // Erstellen und Hinzufügen eines Bildes zum Button
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Button Image';
        img.style.filter = 'grayscale(100%)';
        
        button.appendChild(img);
        
        // Hinzufügen eines Event-Listeners zum Button
        button.addEventListener('click', () => {
            // Setze die Farbe des zuletzt geklickten Buttons zurück
            if (this.lastClickedButton && this.lastClickedButton.firstChild instanceof HTMLElement) {
                (this.lastClickedButton.firstChild as HTMLElement).style.filter = 'grayscale(100%)'; // Standardfilter
            }
    
            // Rufe die übergebene Callback-Funktion auf
            onClickCallback();
    
            // Setze die Hintergrundfarbe des aktuellen Buttons
            if (img instanceof HTMLElement) {
                img.style.filter = ''; // Rot-Tönung
            }
    
            // Speichere diesen Button als den zuletzt geklickten
            this.lastClickedButton = button;
        });
        this.allCreatedElements.push(button);
        return button;
    }
    public createVerticalLayoutWithOffset() {
        // Erstellen und Hinzufügen der Buttons zum rootElement
        const buttonMove = this.createImageButton('./uploads/images/iconMove.png', () => (null), 'vertical-button');
        const buttonRotate = this.createImageButton('./uploads/images/iconRotate.png', () => null, 'vertical-button');
        const buttonScale = this.createImageButton('./uploads/images/iconScale.png', () => null, 'vertical-button');
    
        let leftDistance = "20px";
        let topDistanceStart = 200;

        // Positionierung der Buttons
        buttonMove.style.top = topDistanceStart + "px";
        buttonMove.style.left = leftDistance;
        
        buttonRotate.style.top = topDistanceStart + 50 + "px";
        buttonRotate.style.left = leftDistance;
        
        buttonScale.style.top = topDistanceStart + 100 + "px";
        buttonScale.style.left = leftDistance;
    
        // Hinzufügen der Buttons zum rootElement
        this.rootElement!.prepend(buttonMove);
        this.rootElement!.prepend(buttonRotate);
        this.rootElement!.prepend(buttonScale);
    } 
    public createHorizontalLayoutWithOffset() {
        // Erstellen und Hinzufügen der Buttons zum rootElement
        const buttonCar = this.createImageButton('./uploads/images/car.png', () => null, 'horizontal-button');
        const buttonCrate = this.createImageButton('./uploads/images/fass.png', () => null, 'horizontal-button');
        const buttonTable = this.createImageButton('./uploads/images/table.png', () => null, 'horizontal-button');
        
        // Erstellen eines Containers für die Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'absolute';
        buttonContainer.style.top = '20px';
        buttonContainer.style.left = '50%';
        buttonContainer.style.transform = 'translateX(-50%)';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '1px'; // Abstand zwischen den Buttons
        buttonContainer.style.zIndex = '10';

        // Hinzufügen der Buttons zum Container
        buttonContainer.appendChild(buttonCar);
        buttonContainer.appendChild(buttonCrate);
        buttonContainer.appendChild(buttonTable);

        // Hinzufügen des Containers zum rootElement
        this.rootElement!.prepend(buttonContainer);
    }
    public createVerticalButtonLayout(
        buttonData: { id: string; text: string; onClick: () => void }[],
        topOffset: number = 200,
        gap: number = 10
    ): void {
        if (!this.rootElement) {
            console.error("Root element is not defined. Please set the root element before using this method.");
            return;
        }
    
        // Erstellen eines Containers für die Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'absolute';
        buttonContainer.style.top = `${topOffset}px`; // Startposition
        buttonContainer.style.left = '50%'; // Zentriert
        buttonContainer.style.transform = 'translateX(-50%)'; // Zentrierung
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column'; // Vertikale Anordnung
        buttonContainer.style.alignItems = 'center'; // Horizontal zentrieren
        buttonContainer.style.zIndex = '10'; // Sicherstellen, dass es über anderen Elementen liegt
    
        // Erstellen und Hinzufügen der Buttons mit `marginTop` für den Abstand
        buttonData.forEach((data, index) => {
            const button = this.createButton(data.id, data.text, data.onClick);
            if (index > 0) {
                button.style.marginTop = `${gap * index}px`; // Abstand nur für alle außer den ersten Button
            }
            buttonContainer.appendChild(button);
        });
    
        // Hinzufügen des Containers zum rootElement
        this.allCreatedElements.push(buttonContainer);
        this.rootElement.prepend(buttonContainer);
    }

    public createPlaceButton(text: string, backgroundColor = "#D12BB9") {
        const svgElement = this.tryGetSVG();
        if (!svgElement) return null;
    
        const startButton = document.createElement('Button');
        startButton.innerText = text;
        startButton.id = 'startButton';
        startButton.style.backgroundColor = backgroundColor;
        // Mach den Button unsichtbar
        // startButton.style.visibility = 'hidden';
        if(svgElement.parentNode)
            svgElement.parentNode.insertBefore(startButton, svgElement);
        this.allCreatedElements.push(startButton);
        this.startButton = startButton;
        return startButton;
    }
    private tryGetSVG() {
        return document.querySelector('svg');
    }
    
    public deleteCreatedElements(){
        this.allCreatedElements.forEach((element) => {
            element.remove();
        });
    }

    public removeStartButton(){
        if(!this.startButton) return;
        this.startButton.remove();
        this.startButton = undefined;
    }
    
}

// Verwendung Beispiel
// import { UI_Injector } from '../components/UI_Injector'; 
// const singletonInstance = UI_Injector.getInstance();
// singletonInstance.setScene(currentScene);
// singletonInstance.createRadioButton(); 
