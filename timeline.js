class Timeline {
    constructor() {
        this.formations = []; //element format: {name: "name", slide: slide, dancers: [], ctx: ctx}
        this.curr = -1;
        this.slideT;
        this.slideWidth;
        this.slideHeight;
        this.mouse = {
            dragging: false, numSwaps: 0,
            x: null, y: null, startX: null, startY: null
        };
    }

    addFormation() {
        let newSlide = document.createElement("div");
        newSlide.classList.add("formationSlide");
        if (this.curr != -1) {
            newSlide.classList.add("new");
            requestAnimationFrame(() => newSlide.classList.remove("new"));
        }
        dom.timeline.appendChild(newSlide);
        Util.events(newSlide, {
            "mousedown": evt => {
                let i;
                for (i = 0; i < this.formations.length; i++) {
                    if (this.formations[i].slide === newSlide) {
                        this.selectFormation(i);
                        break;
                    }
                }
                this.mouse.dragging = true;
                this.curr = i;
                this.mouse.startX = evt.clientX;
                this.mouse.startY = evt.clientY;
                this.mouse.x = evt.clientX;
                this.mouse.y = evt.clientY;
                return evt.preventDefault() && false;
            }
        });

        let title = document.createElement("p");
        let name = `Formation ${this.formations.length + 1}`
        title.innerText = name;
        newSlide.appendChild(title);

        let img = document.createElement("canvas");
        newSlide.appendChild(img);
        img.setAttribute("width", parseInt(Util.getStyleValue(img, "width"))); //resize good
        img.setAttribute("height", parseInt(Util.getStyleValue(img, "height")));

        let ctx = getTrackedContext(img.getContext('2d', { alpha: false }));
        stageView.draw(ctx, true);
        let dancers = [];
        stageView.dancers.forEach(dancer => {
            dancers.push(Object.assign({}, dancer));
        });

        let insert = this.curr + 1;
        this.formations.splice(insert, 0, { name: name, slide: newSlide, dancers: dancers, ctx: ctx });
        this.resetOrder();
        this.selectFormation(insert);
        dom.deleteFormation.disabled = this.formations.length === 1;
    }
    selectFormation(i = this.curr) {
        let formation = this.formations[i];
        if (this.curr !== -1) this.formations[this.curr].slide.classList.remove("selected");
        this.curr = i;
        formation.slide.classList.add("selected");
        stageView.dancers = formation.dancers;
        dom.removeDancer.disabled = true;
        stageView.selected = [];
        stageView.draw();
        setTimeout(() => stageView.draw(), this.slideT * 1000);
    }
    deleteFormation() {
        let del = this.formations.splice(this.curr, 1)[0];
        dom.deleteFormation.disabled = this.formations.length === 1;
        this.resetOrder();
        del.slide.style.setProperty("order", this.curr * 2 - 1);
        this.curr = this.curr === 0 ? 0 : this.curr - 1;
        this.selectFormation();
        del.slide.classList.remove("selected");
        del.slide.style.setProperty("z-index", 0);
        del.slide.classList.add("removing");
        setTimeout(() => dom.timeline.removeChild(del.slide), this.slideT * 1000);
    }
    resetOrder() {
        for (let i = 0; i < this.formations.length; i++) {
            let slide = this.formations[i].slide;
            slide.style.setProperty("order", i * 2);
        }
    }
    dragSlide(evt) {
        let deltaX = this.mouse.x - this.mouse.startX;
        let offsetX = this.mouse.numSwaps * this.slideWidth;
        let swapHelper = (evt, dir) => {
            this.mouse.numSwaps += dir;
            let temp = this.formations[this.curr + dir];
            this.formations[this.curr + dir] = this.formations[this.curr];
            this.formations[this.curr] = temp;
            this.resetOrder();
        };
        if (deltaX > this.slideWidth / 2 + offsetX && this.curr < this.formations.length - 1) {
            swapHelper(evt, 1);
            this.curr++;
        } else if (deltaX < -this.slideWidth / 2 + offsetX && this.curr > 0) {
            swapHelper(evt, -1);
            this.curr--;
        }
    }
}