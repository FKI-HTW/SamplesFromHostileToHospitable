
import { WebGLRenderer, PerspectiveCamera, Vector3, Object3D } from "three";
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { UI_Injector } from "./UI_Injector";
import EventManager from "./EventManager";

class ARManager {
    private hitTestSource: XRHitTestSource | null = null;
    private hitTestSourceRequested = false;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private contentObject: Object3D | null = null;
    private arButton!: HTMLElement;

    private eventManager: EventManager = new EventManager;

    constructor(renderer: WebGLRenderer, camera: PerspectiveCamera, eventManager: EventManager) {
        this.renderer = renderer;
        this.camera = camera;

        this.eventManager = eventManager;
    }

    public setupAR() {
        // Add AR button to the scene
        this.arButton = ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] });
        document.body.appendChild(this.arButton);
        // AR Session has started
        this.renderer.xr.addEventListener('sessionstart', () => {
            console.log('AR session started');
            this.requestHitTestSource();
            // Delte all previous html elements
            UI_Injector.getInstance().removeStartButton();
            // UI_Injector.getInstance().deleteCreatedElements();
            // Create place button when AR session has started
            const placeButton : HTMLElement | null  = UI_Injector.getInstance().createPlaceButton("Place Content");
            if(placeButton)
                placeButton.onclick = this.placeObject.bind(this);

        });
        // When there is no content yet, make AR Button not interactable
        if(!this.contentObject){
            this.arButton.style.pointerEvents = "none";
            this.arButton.style.opacity = "0.5";
        }
    }

    public setContent(content: Object3D){
        this.contentObject = content;
        this.arButton.style.pointerEvents = "auto";
    }

    private placeObject(){
        console.log("button place");
        this.hitTestSource = null;
        UI_Injector.getInstance().removeStartButton();

        // TODO Timeline
        this.eventManager.emit("placeObject");
    }

    private requestHitTestSource() {
        const session = this.renderer.xr.getSession();
        if (session && !this.hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                (session as any).requestHitTestSource({ space: referenceSpace }).then((source: XRHitTestSource | null) => {
                    this.hitTestSource = source;
                });
            });

            this.hitTestSourceRequested = true;

            // When AR Session is closed
            session.addEventListener('end', () => {
                this.hitTestSourceRequested = false;
                this.hitTestSource = null;
                // Try destroing last object
                if(this.contentObject != null && this.contentObject.parent){
                    this.contentObject.parent.remove(this.contentObject);
                    this.arButton.style.pointerEvents = "none";
                    this.contentObject = null;
                }
            });
        }
    }

    // TODO stop tracking by condition
    public trackHitSource(frame: XRFrame) {
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        // console.log(referenceSpace);
        if (referenceSpace && this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(referenceSpace);

                if (hitPose && this.contentObject) {
                    const newY = hitPose.transform.position.y;
                    const direction = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                    this.contentObject.position.set(
                        hitPose.transform.position.x,
                        newY,
                        hitPose.transform.position.z
                    );
                    this.contentObject.visible = true;
                }
            }
        }
    }
}

export default ARManager;
