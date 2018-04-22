//TODO: Transitions

class Timeline {
    constructor(slideT, slideWidth, slideHeight, slideSpacing, slideSmaller) {
        this.formations = []; //ex: {name: "name", slide: slide, ctx: ctx, comment: comment}
        this.curr = -1;
        this.totalEver = 1; //number of slides that have ever been added
        this.slideT = slideT;
        this.slideWidth = slideWidth;
        this.slideHeight = slideHeight;
        this.slideSpacing = slideSpacing;
        this.slideSmaller = slideSmaller;
        this.slideSpace = this.slideWidth * this.slideSmaller + this.slideSpacing
        this.mouse = { dragging: false, slide: null, numSwaps: 0, x: null, startX: null, lastX: null };
    }

    addFormation() {
        this.selectFormation(this.formations.length - 1);
        this.insertFormation();
    }
    insertFormation() {
        let newSlide = document.createElement("div");
        newSlide.classList.add("formationSlide");
        if (this.curr != -1) {
            newSlide.classList.add("new");
            requestAnimationFrame(() => newSlide.classList.remove("new"));
        }
        dom.timeline.appendChild(newSlide);
        Util.events(newSlide, {
            "mousedown": evt => {
                for (let i = 0; i < this.formations.length; i++) {
                    if (this.formations[i].slide === newSlide) {
                        this.mouse.slide = i;
                        break;
                    }
                }
                this.mouse.dragging = true;
                this.mouse.startX = evt.clientX;
                this.mouse.x = evt.clientX;
                this.mouse.lastX = evt.clientX;
            },
            "click": evt => this.selectFormation(this.mouse.slide)
            //TODO: Add keydown event here for things like delete
        });

        let name = document.createElement("p");
        name.innerText = `Formation ${this.totalEver++}`;
        name.resizeMe = () => {
            let size = 30;
            
            let width = stageView.measureText(dom.sansFont, size, "normal", name.innerText);
            size *= this.slideWidth / width;
            size = Math.max(Math.min(size, 34), 18);
            if(!name.parentElement.classList.contains("selected"))
                size *= this.slideSmaller;
            name.style.setProperty("font-size", `${size}px`);
            let bott = 8 * size / 30;
            name.style.setProperty("padding-bottom", `${bott}px`);
            width = stageView.measureText(dom.sansFont, size, "normal", name.innerText);
            if (width > 1.98 * this.slideWidth){
                name.style.setProperty("line-height", `${20}px`);
                name.style.setProperty("padding-bottom", `${0}px`);
            }else{
                name.style.setProperty("line-height", `${30}px`);
            }
        };
        newSlide.appendChild(name);

        let img = document.createElement("canvas");
        img.tabIndex = 1;
        newSlide.appendChild(img);
        img.setAttribute("width", parseInt(Util.getStyleValue(img, "width"))); //resize good
        img.setAttribute("height", parseInt(Util.getStyleValue(img, "height")));

        let ctx = getTrackedContext(img.getContext('2d', { alpha: false }));
        stageView.draw(ctx, true);

        let insert = this.curr + 1;
        this.formations.splice(insert, 0, { name: name, slide: newSlide, ctx: ctx, comment: "" });
        let positions = {};
        stageView.dancers.forEach(dancer => {
            dancer.positions.splice(insert, 0, Object.assign({}, dancer.positions[this.curr]));
        });

        this.resetOrder();
        this.selectFormation(insert);
        dom.deleteFormation.disabled = this.formations.length === 1;

        let contentWidth = dom.timeline.scrollWidth - dom.timelinePaddingLeft.clientWidth -
            dom.timelinePaddingRight.clientWidth;
        if (contentWidth + this.slideWidth - this.slideSpacing * 2 + 3 > dom.timeline.clientWidth) {
            dom.root.style.setProperty("--slide-height", "130px");
            dom.root.style.setProperty("--extra", "2em + 22px");
            dom.root.style.setProperty("--down", "4px");
        }
    }
    selectFormation(i, deleting = false) {
        let formation = this.formations[i];
        if (this.curr !== -1) { //-1 is before first slide added
            this.formations[this.curr].slide.classList.remove("selected");
            this.formations[this.curr].name.resizeMe();
            if (!deleting)
                this.formations[this.curr].comment = dom.formationCommentsBox.value;
        }
        this.curr = i;
        formation.slide.classList.add("selected");
        formation.name.resizeMe();
        dom.formationCommentsBox.value = formation.comment;
        dom.formationTitle.value = formation.name.innerText;
        formationTitleWidth();
        this.scrollStart = dom.timeline.scrollLeft;
        this.scrollTarget = null;
        let scrollAnim = (frames, currFrame = 0) => {
            requestAnimationFrame(() => {
                let scrollL = this.scrollStart + (this.scrollTarget - this.scrollStart) *
                    Math.sin(Math.PI / 2 * currFrame / frames);
                dom.timeline.scrollLeft = scrollL;
                if (currFrame < frames) scrollAnim(frames, currFrame + 1);
            });
        };
        let left = formation.slide.offsetLeft - this.slideSpace / 2;
        let right = formation.slide.offsetLeft + this.slideSpace * 1.5 - dom.timeline.clientWidth;
        if (dom.timeline.scrollLeft > left) {
            this.scrollTarget = left;
            scrollAnim(30);
        } else if (dom.timeline.scrollLeft < right) {
            this.scrollTarget = right;
            scrollAnim(30);
        }
        stageView.draw();
    }
    deleteFormation() {
        let del = this.formations.splice(this.curr, 1)[0];
        stageView.dancers.forEach(dancer => {
            dancer.positions.splice(this.curr, 1);
        });
        dom.deleteFormation.disabled = this.formations.length === 1;
        this.resetOrder();
        del.slide.style.setProperty("order", this.curr * 2 - 1);
        this.curr = this.curr === 0 ? 0 : this.curr - 1;
        this.selectFormation(this.curr, true);
        del.slide.classList.remove("selected");
        del.slide.style.setProperty("z-index", 0);
        del.slide.classList.add("removing");
        setTimeout(() => dom.timeline.removeChild(del.slide), this.slideT * 1000);
        if (dom.timeline.scrollWidth - this.slideWidth <= dom.timeline.clientWidth) {
            dom.root.style.setProperty("--slide-height", "140px");
            dom.root.style.setProperty("--extra", "2em + 12px");
            dom.root.style.setProperty("--down", "12px");
        }
    }
    /** Sets the 'order' css property for all slides based on index in this.formations */
    resetOrder() {
        for (let i = 0; i < this.formations.length; i++) {
            let slide = this.formations[i].slide;
            slide.style.setProperty("order", i * 2);
            if (i === this.formations.length - 1) slide.classList.add("last");
            else slide.classList.remove("last");
        }
    }
    resizeSlides() {
        if (dom.timeline.scrollWidth <= dom.timeline.clientWidth) {
            dom.root.style.setProperty("--slide-height", "140px");
            dom.root.style.setProperty("--extra", "2em + 12px");
            dom.root.style.setProperty("--down", "12px");
        } else {
            dom.root.style.setProperty("--slide-height", "130px");
            dom.root.style.setProperty("--extra", "2em + 22px");
            dom.root.style.setProperty("--down", "4px");
        }
    }

    dragSlide(evt) {
        let deltaX = this.mouse.x - this.mouse.startX;
        let offsetX = this.mouse.numSwaps * this.slideWidth;
        let swapHelper = (evt, dir) => {
            let oldCurr = this.formations[this.curr];
            this.mouse.numSwaps += dir;
            let temp = this.formations[this.mouse.slide + dir];
            this.formations[this.mouse.slide + dir] = this.formations[this.mouse.slide];
            this.formations[this.mouse.slide] = temp;
            stageView.dancers.forEach(dancer => {
                temp = dancer.positions[this.mouse.slide + dir];
                dancer.positions[this.mouse.slide + dir] = dancer.positions[this.mouse.slide];
                dancer.positions[this.mouse.slide] = temp;
            });
            for (let i = 0; i < this.formations.length; i++) {
                if (this.formations[i] === oldCurr) {
                    this.curr = i;
                    break;
                }
            }
            this.mouse.slide += dir;
            this.resetOrder();
        };
        if (deltaX > this.slideWidth / 2 + offsetX && this.mouse.slide < this.formations.length - 1)
            swapHelper(evt, 1);
        else if (deltaX < -this.slideWidth / 2 + offsetX && this.mouse.slide > 0)
            swapHelper(evt, -1);
    }
}