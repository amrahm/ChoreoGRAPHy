class GroupsView {
    constructor(){
        this.groups = new Map([]);
        this.actives = new Map([]);
        this.curr = 0;
        this.active = -1;
        this.colors = new Map([
            [0,"skyblue"],
            [1, "yellowgreen"],
            [2, "#85144b"],
            [3, "mediumaquamarine"],
            [4, "royalblue"],
            [5, "orangered"],
            [6, "salmon"],
            [7, "magenta"],
            [8, "#FF851B"],
            [9, "gold"],
            [10, "turquoise"],
            [11, "olive"],
            [12, "#01FF70"],
            [13, "#944743"],
            [14, "#DBB1CD"],
            [15, "#EC9787"]
        ]);
    }

    getActiveColor() {
        return this.active;
    }

    getColorOfGroup(id){
        if (this.actives.has(id)) {
            let activeGroup = document.getElementById("group" + id);
            return activeGroup.style.backgroundColor;
        } else {
            return "rgb(60, 60, 60)";
        }
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
      }

    randomColor() {
        return this.getRandomInt(248);
    }

    addGroup() {
        this.curr = this.curr + 1;
        let newGroup = document.createElement("button");
        newGroup.setAttribute("id", "group" + this.curr);
        let ind = this.curr % this.colors.size;
        newGroup.style.background = this.colors.get(ind);
        let newGroupDelete = document.createElement("button");
        newGroupDelete.innerHTML = "🗑️";
        newGroupDelete.setAttribute("onClick", "groupsView.deleteGroup(" + this.curr + ");");
        newGroup.setAttribute("onClick", "groupsView.activateGroup(" + this.curr + ");");
        newGroupDelete.classList.add("deleteGroup");
        newGroupDelete.style.alignSelf = "right";
        newGroup.innerHTML = "Group " + this.curr;
        newGroup.classList.add("groupIcon");
        let child0 = document.createElement("div");
        child0.style.width = "100%";
        let separator = document.createElement("div");
        separator.style.width = "20%";
        child0.appendChild(separator);
        child0.appendChild(newGroupDelete);
        newGroup.appendChild(child0);
        dom.groupsDiv.appendChild(newGroup);
        this.groups.set(this.curr, newGroup);
        this.actives.set(this.curr, false);
        newGroup.focus();
        this.activateGroup(this.curr);
    }

    deleteGroup(ind) {
        var groupToKill = eval(ind);
        dom.groupsDiv.removeChild(document.getElementById("group" + groupToKill));
        this.groups.delete(groupToKill);
        this.actives.delete(groupToKill);
        stageView.draw();
    }

    activateGroup(ind) {
        if (this.actives.has(eval(ind))){
            var activeGroupI = eval(ind);
            let activeGroup = document.getElementById("group" + activeGroupI);
            if (this.actives.get(ind) === false) {
                var i;
                for(i = 0; i < this.curr+1; i++){
                    if(this.actives.get(i) === true) {
                        this.activateGroup(i);
                    }
                }            
                this.actives.set(ind, true);
                // activeGroup.style.boxShadow = "0px 0px 40px rgba(0, 89, 255, 0.7) inset";
                // activeGroup.style.color = "white";
                // activeGroup.style.fontWeight = "bold";
                // activeGroup.style.borderColor = "aqua";
                activeGroup.classList.add("active");
                this.active = ind;
            } else {
                this.actives.set(ind, false);
                activeGroup.classList.remove("active");
                // activeGroup.style = "revert";
                // activeGroup.style.background = this.colors.get(ind % this.colors.size);
                this.active = -1;
            }
        }
        // else the group has been removed and nothing should be done
    }

}
