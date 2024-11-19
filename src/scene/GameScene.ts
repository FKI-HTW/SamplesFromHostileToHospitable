
import { BoxGeometry, DirectionalLight, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";

import ARManager from '../ARManager';
import { importJSON, JSONDataItem } from "../DataParser";
import { UI_Injector } from "../UI_Injector";
import Timeline from "../Timeline";
import EventManager from "../EventManager";

class GameScene {
    private static _instance = new GameScene();
    public static get instance() {
        return this._instance;
    }

    private width: number;
    private height: number;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;

    private readonly scene = new Scene();
    private directionalLight: DirectionalLight = new DirectionalLight(0xffffff, 4);

    private arManager: ARManager;
    private timeline: Timeline;
    private ui_singleton = UI_Injector.getInstance();

    private loadedJSON: JSONDataItem | null | undefined;

    private mainModel: Object3D | undefined;

    private eventManager : EventManager = new EventManager();

    private constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.xr.enabled = true;  // Enable XR for AR

        // find target html element
        const targetElement = document.querySelector<HTMLDivElement>("#app");
        if (!targetElement)
            throw "unable to find target element";
        targetElement.appendChild(this.renderer.domElement);
        
        const aspectRatio = this.width / this.height;
        this.camera = new PerspectiveCamera(75, aspectRatio, 0.1, 1000);

        this.scene.add(this.directionalLight);

        // Debug UI
        this.ui_singleton.createVerticalButtonLayout(
            [
                { id: 'btn', text: 'Content A', onClick: () => this.prepareData(0) },
                { id: 'btn', text: 'Content B', onClick: () => this.prepareData(1) },
                { id: 'btn', text: 'Content C', onClick: () => this.prepareData(2) }
            ],
            40, // Top-Offset
            60 // Distance between buttons
        );
        
        this.timeline = new Timeline(this.scene, this.camera, this.renderer);
        this.arManager = new ARManager(this.renderer, this.camera, this.eventManager);

        window.addEventListener("resize", this.resize, false);

        this.eventManager.subscribe("placeObject", () => this.timeline.start());

        this.renderer.setAnimationLoop(this.update);
    }

    private async prepareData(index: number){
        this.loadedJSON =  await this.loadExternalData(index);
    }

    private resize = () => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    };

    private update = (_timestamp: number, frame: XRFrame) => {
        this.arManager.trackHitSource(frame);
        this.renderer.render(this.scene, this.camera);
    }

    public prepareAR() {
        this.arManager.setupAR();
    }

    private async loadExternalData(parameterID: number): Promise<JSONDataItem | null> {
        if (isNaN(parameterID) || parameterID < 0) {
            console.error(`Invalid parameterID: ${parameterID}`);
            return null;
        }
    
        try {
            const json = await importJSON(parameterID);
            if (json === null) {
                console.warn(`Not date found for parameterID: ${parameterID}`);
                return null;
            }
    
            console.log(json.pathModel);
            // TODO improve
            this.TestLoadModel(json.pathModel);
            return json as JSONDataItem;
        } catch (error) {
            console.error("Error why loading external data:", error);
            return null;
        }
    }

    private async TestLoadModel(pathModel: string) {
        const gltf = await this.timeline.loadModel(pathModel);
    
        // Remove previous model
        if(this.mainModel)
            this.scene.remove(this.mainModel);
        // Add new model to scene
        const model = gltf.scene;
        this.scene.add(model);

        this.mainModel = model;

        // Transform tests
        this.mainModel.rotation.y = Math.PI;
        const scaleFactor: number = 0.2;
        this.mainModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Assign new model to AR Manager
        this.arManager.setContent(this.mainModel);
    }
    
}

export default GameScene;
