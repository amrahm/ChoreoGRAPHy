//TODO We need a way to get back to this state
/** Implements drawing a custom stage */
class StageDrawing extends EventTarget {
    constructor(dom){
        super();
        this.dom = dom;
    }

    domContentLoaded(){
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.confirmStage = Util.one("#confirmStage");

        dom.confirmStage.addEventListener("click", () => {
            dom.stageDrawing.style.display = "none";
        });
    }
}