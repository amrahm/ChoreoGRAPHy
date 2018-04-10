class StageView extends EventTarget {
    constructor(dom){
        super();
        this.dom = dom;
    }

    domContentLoaded(){
        dom.stageView = Util.one("#stageView");
        dom.addDancer = Util.one("#addDancer");
        dom.removeDancer = Util.one("#removeDancer");

        dom.addDancer.addEventListener("click", () => {
            console.log("ADD");
        });
    }
}