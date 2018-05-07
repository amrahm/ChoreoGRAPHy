class GroupsView {
    constructor(){
        this.groups = new Map([]);
        this.curr = 0;
        this.total = 0;
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
        var randomC  = "rgb("+this.randomColor()+","+this.randomColor()+","+this.randomColor()+")";
        console.log(randomC);
        newGroup.background = randomC;
        let newGroupDelete = document.createElement("button");
        newGroupDelete.innerHTML = "🗑️";
        newGroupDelete.setAttribute("onClick", "groupsView.deleteGroup(" + this.curr + ");");
        newGroupDelete.classList.add("deleteGroup");
        newGroupDelete.style.alignSelf = "right";
        newGroup.innerHTML = "Group " + this.curr;
        newGroup.classList.add("groupIcon");
        newGroup.appendChild(newGroupDelete);
        dom.groupsDiv.appendChild(newGroup);
        this.groups.set(this.curr, newGroup);
        newGroupDelete.focus();
    }

    deleteGroup(ind) {
        var groupToKill = eval(ind);
        dom.groupsDiv.removeChild(document.getElementById("group" + groupToKill));
        this.groups.delete(groupToKill);
    }
}
