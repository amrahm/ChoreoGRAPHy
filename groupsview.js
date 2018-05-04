class GroupsView {
    constructor(){
        this.groups = new Map([]);
        this.curr = 0;
        this.total = 0;
    }

    addGroup() {
        this.curr = this.curr + 1;
        let newGroup = document.createElement("div");
        newGroup.setAttribute("id", "group" + this.curr);
        let newGroupDelete = document.createElement("button");
        newGroupDelete.innerHTML = " - ";
        newGroupDelete.setAttribute("onClick", "groupsView.deleteGroup(" + this.curr + ");");
        newGroupDelete.classList.add("deleteGroup");
        newGroup.innerHTML = "Group " + this.curr;
        newGroup.classList.add("groupIcon");
        newGroup.appendChild(newGroupDelete);
        dom.groupsDiv.appendChild(newGroup);
        this.groups.set(this.curr, newGroup);
    }

    deleteGroup(ind) {
        var groupToKill = eval(ind);
        dom.groupsDiv.removeChild(document.getElementById("group" + groupToKill));
        this.groups.delete(groupToKill);
    }
}
