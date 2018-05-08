//TODO: Transitions
//TODO: Arrows for switching
//TODO: Smoother rearrange

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
    insertFormation(shouldSave = true, isNew = true, otherFormation = null, insertBefore = false) {
        if (shouldSave) saveState();
        let newSlide = isNew ? document.createElement("div") : otherFormation.slide;
        let name = isNew ? document.createElement("p") : otherFormation.name;
        let ctx = isNew ? null : otherFormation.ctx;
        let comment = isNew ? "" : otherFormation.comment;
        dom.timeline.appendChild(newSlide);

        let insert = insertBefore ? this.curr : this.curr + 1; //where the new slide will be inserted

        if (isNew) {
            newSlide.classList.add("formationSlide");
            if (this.curr != -1) {
                newSlide.classList.add("new");
                requestAnimationFrame(() => newSlide.classList.remove("new"));
            }
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
            });
            name.innerText = `Formation ${this.totalEver++}`;
            name.resizeMe = () => {
                let size = 25;

                let width = stageView.measureText(dom.sansFont, size, "normal", name.innerText);
                size *= this.slideWidth / width;
                size = Math.max(Math.min(size, 29), 18);
                if (!name.parentElement.classList.contains("selected"))
                    size *= this.slideSmaller;
                name.style.setProperty("font-size", `${size}px`);
                let bott = 8 * size / 30;
                name.style.setProperty("padding-bottom", `${bott}px`);
                width = stageView.measureText(dom.sansFont, size, "normal", name.innerText);
                if (width > 1.98 * this.slideWidth) {
                    name.style.setProperty("line-height", `${20}px`);
                    name.style.setProperty("padding-bottom", `${0}px`);
                } else {
                    name.style.setProperty("line-height", `${30}px`);
                }
            };

            newSlide.appendChild(name);


            let img = document.createElement("canvas");
            img.tabIndex = 1;
            newSlide.appendChild(img);
            img.setAttribute("width", parseInt(Util.getStyleValue(img, "width"))); //resize good
            img.setAttribute("height", parseInt(Util.getStyleValue(img, "height")));

            ctx = getTrackedContext(img.getContext('2d', { alpha: false }));
            stageView.draw(ctx, true);


            stageView.dancers.forEach(dancer => {
                dancer.positions.splice(insert, 0, Object.assign({}, dancer.positions[this.curr]));
                dancer.groups.splice(insert, 0, dancer.groups[this.curr]);
            });
        } else {
            newSlide.classList.remove("removing");
        }


        this.formations.splice(insert, 0, { name: name, slide: newSlide, ctx: ctx, comment: comment });
        // console.log("FORMATIONS", this.formations);
        if (isNew) {
            this.resetOrder();
            this.selectFormation(insert);
        }
        dom.deleteFormation.disabled = this.formations.length === 1;
    }
    selectFormation(i, deleting = false, changingFormations = false) {
        // console.log("SELECTING", i);

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
        if (!changingFormations) stageView.draw();
    }
    deleteFormation(shouldSave = true) {
        if (shouldSave) saveState();
        let del = this.formations.splice(this.curr, 1)[0];
        if (shouldSave) {
            stageView.dancers.forEach(dancer => {
                dancer.positions.splice(this.curr, 1);
                dancer.groups.splice(this.curr, 1);
            });
        }
        dom.deleteFormation.disabled = this.formations.length === 1;
        this.resetOrder();
        del.slide.style.setProperty("order", this.curr * 2 - 1);
        this.curr = this.curr === 0 ? 0 : this.curr - 1;
        this.selectFormation(this.curr, true);
        del.slide.classList.remove("selected");
        del.slide.style.setProperty("z-index", 0);
        del.slide.classList.add("removing");
        if (shouldSave) {
            setTimeout(() => dom.timeline.removeChild(del.slide), this.slideT * 1000);
        } else {
            dom.timeline.removeChild(del.slide);
        }
    }

    /**Change the set of formations cause an undo */
    changeFormations(otherFormations) {
        // console.log("CHANGE", this.formations, otherFormations);

        if (this.formations.length > otherFormations.length) {
            for (let i = 0; i < otherFormations.length; i++) {
                if (this.formations[i].name.innerText != otherFormations[i].name.innerText) {
                    this.selectFormation(i, true, true);
                    this.deleteFormation(false);
                    return;
                }
            }
            this.selectFormation(this.formations.length - 1, true, true);
            this.deleteFormation(false);
        } else if (this.formations.length < otherFormations.length) {
            for (let i = 0; i < this.formations.length; i++) {
                let inserted = false;
                if (this.formations[i].name.innerText != otherFormations[i].name.innerText) {
                    inserted = true;
                    this.selectFormation(i, false, true);
                    this.insertFormation(false, false, otherFormations[i], true);
                    return;
                }
            }
            this.selectFormation(this.formations.length - 1, false, true);
            this.insertFormation(false, false, otherFormations[otherFormations.length - 1]);
        }
        this.formations = otherFormations;
        this.resetOrder();
    }

    resetThumbnails() {
        for (let i = 0; i < timeline.formations.length; i++) {
            let width = parseInt(Util.getStyleValue(timeline.formations[i].ctx.canvas, "width"));
            let height = parseInt(Util.getStyleValue(timeline.formations[i].ctx.canvas, "height"));
            if (i === this.curr) {
                width *= this.slideSmaller;
                height *= this.slideSmaller;
            }
            stageView.resetView(timeline.formations[i].ctx, width, height);
            stageView.draw(timeline.formations[i].ctx, false, i);
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

    dragSlide(evt) {
        let deltaX = this.mouse.x - this.mouse.startX;
        let offsetX = this.mouse.numSwaps * this.slideWidth;
        let slide = this.formations[this.mouse.slide].slide;
        let swapHelper = (evt, dir) => {
            saveState();
            slide.style.setProperty("--deltaX", `${deltaX - offsetX}px`);
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
        if (deltaX > this.slideWidth / 2 + offsetX && this.mouse.slide < this.formations.length - 1) {
            swapHelper(evt, 1);
        } else if (deltaX < -this.slideWidth / 2 + offsetX && this.mouse.slide > 0) {
            swapHelper(evt, -1);
        } else if (Math.abs(deltaX) > 3) {
            if (!slide.classList.contains("dragging")) {
                let dragEndHelper = slide => {
                    slide.classList.add("dragEnding");
                    slide.classList.remove("dragging");
                    let promise = Util.afterAnimation(slide, "dragEnd");
                    promise.then(() => {
                        slide.classList.remove("dragEnding");
                    });
                }
                slide.addEventListener("mouseup", () => dragEndHelper(slide));
                slide.addEventListener("mouseleave", () => dragEndHelper(slide));
            }
            slide.classList.add("dragging");
            slide.style.setProperty("--deltaX", `${deltaX - offsetX}px`);
        }
    }

    keydown(evt) {
        if (evt.keyCode === 46) { //:::DELETE (Del)
            if (this.formations.length < 2) return;
            this.deleteFormation();
        }
        if (evt.keyCode === 37 && this.curr > 0) { //left
            this.selectFormation(this.curr - 1);
            return evt.preventDefault() && false;
        } else if (evt.keyCode === 39 && this.curr < this.formations.length - 1) { //right
            this.selectFormation(this.curr + 1);
            return evt.preventDefault() && false;
        }
    }
}