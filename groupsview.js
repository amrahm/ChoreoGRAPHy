class GroupsView {
    constructor(){
        this.groups = new Map([]);
        this.actives = new Map([]);
        this.curr = 0;
        this.active = -1;
        this.colors = new Map([
            [0,"yellowgreen"],
            [1, "skyblue"],
            [2, "magenta"],
            [3, "orangered"],
            [4, "turquoise"],
            [5, "salmon"],
            [6, "mediumaquamarine"],
            [7, "royalblue"],
            [8, "gold"]
        ]);
    }

    getActiveColor() {
        return this.active;
    }

    getColorOfGroup(id){
        if (id != -1) {
            let activeGroup = document.getElementById("group" + id);
            if (this.actives.get(id)){
                return activeGroup.style.backgroundColor;
            } else {
                return "rgb(60, 60, 60)"
            }
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
        let newGroup = document.createElement("div");
        newGroup.setAttribute("id", "group" + this.curr);
        let ind = this.curr % this.colors.size;
        newGroup.style.background = this.colors.get(ind);
        let newGroupDelete = document.createElement("button");
        let newGroupActive = document.createElement("button");
        let newGroupInactive = document.createElement("button");
        newGroupActive.setAttribute("id", "activate"+this.curr);
        newGroupInactive.setAttribute("id", "deactivate"+this.curr);
        //let child1 = document.createElement("input");
        // child1.setAttribute("type", "checkbox");
        // let child2 = document.createElement("span");
        // child2.classList.add("slider");
        // newGroupActive.appendChild(child1);
        // newGroupActive.appendChild(child2);
        newGroupDelete.innerHTML = "🗑️";
        newGroupActive.innerHTML = "➕";
        newGroupInactive.innerHTML = "➖";
        newGroupDelete.setAttribute("onClick", "groupsView.deleteGroup(" + this.curr + ");");
        newGroupActive.setAttribute("onClick", "groupsView.activateGroup(" + this.curr + ");");
        newGroupInactive.setAttribute("onClick", "groupsView.deactivateGroup(" + this.curr + ");");
        newGroupActive.style.borderWidth = "1px";
        newGroupActive.style.borderColor = "transparent";
        newGroupActive.classList.add("addButton");
        newGroupInactive.classList.add("addButton");
        newGroupDelete.classList.add("deleteGroup");
        newGroupDelete.style.alignSelf = "right";
        newGroup.innerHTML = "Group " + this.curr;
        newGroup.classList.add("groupIcon");
        let child0 = document.createElement("div");
        child0.style.width = "100%";
        let separator = document.createElement("div");
        separator.style.width = "20%";
        child0.appendChild(newGroupActive);
        child0.appendChild(newGroupInactive);
        child0.appendChild(separator);
        child0.appendChild(newGroupDelete);
        newGroup.appendChild(child0);
        dom.groupsDiv.appendChild(newGroup);
        this.groups.set(this.curr, newGroup);
        this.actives.set(this.curr, false);
        newGroupActive.focus();
    }

    deleteGroup(ind) {
        var groupToKill = eval(ind);
        dom.groupsDiv.removeChild(document.getElementById("group" + groupToKill));
        this.groups.delete(groupToKill);
        this.actives.delete(groupToKill);
    }

    activateGroup(ind) {
        var activeGroupI = eval(ind);
        let activeGroup = document.getElementById("group" + activeGroupI);
        let activeButton = document.getElementById("activate" + ind);
        let inactiveButton = document.getElementById("deactivate"+ind);
        if (this.actives.get(ind) === false) {
            var i;
            for(i = 0; i < this.curr+1; i++){
                if(this.actives.get(i) === true) {
                    this.activateGroup(i);
                }
            }            
            this.actives.set(ind, true);
            activeGroup.style.boxShadow = "0px 0px 20px rgba(0, 89, 255, 0.7) inset";
            activeGroup.style.color = "white";
            activeGroup.style.fontWeight = "bold";
            activeGroup.style.borderColor = "aqua";
            //activeButton.style.background = "limegreen";
            activeButton.style.borderWidth = "5px";
            activeButton.style.borderColor = "white";
            activeButton.style.background = "navy";
            inactiveButton.style.background = "transparent";
            this.active = ind;
        } else {
            this.actives.set(ind, false);
            activeGroup.style.boxShadow = "none";
            activeGroup.style.color = "black";
            activeGroup.style.fontWeight = "normal";
            activeGroup.style.borderColor = "black";
            activeGroup.style.borderWidth = "1px";
            activeButton.style.background = "transparent";
            this.active = -1;
        }
    }
    deactivateGroup(ind){
        // this is when a group's - button is pressed
        // so technically focus is still on it but we can't add dancers anymore
        var activeGroupI = eval(ind);
        let activeGroup = document.getElementById("group" + activeGroupI);
        let activeButton = document.getElementById("activate" + ind);
        let inactiveButton = document.getElementById("deactivate"+ind);
        this.actives.set(ind, false);
        activeGroup.style.boxShadow = "0px 0px 20px rgba(0, 89, 255, 0.7) inset";
        activeGroup.style.color = "white";
        activeGroup.style.fontWeight = "bold";
        activeGroup.style.borderColor = "aqua";
        activeButton.style.background = "transparent";    
        inactiveButton.style.background = "navy";
    }
}
