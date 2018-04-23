//TODO: We need a way to get back to this state
/** Implements drawing a custom stage */
class StageDrawing extends EventTarget {

    // constructor
    constructor() {
        super();
        this.stage = new Path2D();
        this.colors = {
            "preview": "#0c8",
            "stroke": "#363636",
            "anchor": "#0cc"
        };
    }

    extend(){
    
        if (arguments.length < 2) return;
        var extended = arguments[0];
        for (var _x = 1, _xx = arguments.length; _x < _xx; _x++) {
          var base = arguments[_x];
          for (var key in base) {
            extended[key] = base[key];
          }
        }
        return extended;
      };

    Line(parent, x1, y1, x2, y2) {

        var id = parent.newId();
        this.__id = id;
        this.id = parent.prefix + "-" + id;
        this.anchorWidth = 5;
        this.type = "line";
        this.parent = parent;
        var canvas = parent.canvas,
            ctx = parent.ctx;

        this.origin = {};
        this.target = {};


        this.origin.x = x1 || 0;
        this.origin.y = y1 || 0;

        this.target.x = x2 || x1;
        this.target.y = y2 || y1;

        this.hidden = false;

        this.anchor = function (x, y) {

            var n = this.anchorWidth / 2;
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = this.parent.colors.anchor;
            ctx.strokeRect(x - n, y - n, n * 2, n * 2);
            ctx.globalCompositeOperation = "source-over";
        };

        this.drawOrigin = function () {

            this.anchor(this.origin.x, this.origin.y);
        };

        this.drawTarget = function () {

            this.anchor(this.target.x, this.target.y);
        };

        this.to = function (x, y) {

            // allow passing in of single parameters
            this.target.x = x !== undefined ? x : this.target.x;
            this.target.y = y !== undefined ? y : this.target.y;
        };
    }


    render(c) {

            // c passed in for previewing.
            if (c === undefined && this.hidden) return;

            ctx.strokeStyle = c || this.parent.colors.stroke;

            ctx.beginPath();
            var p = new Path2D();
            p.moveTo(this.origin.x, this.origin.y);
            p.lineTo(this.target.x, this.target.y);
            p.stroke();
            this.path = p;
            console.log(p);
    }

    preview () {

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.parent.render();
            this.drawOrigin();
            this.render(this.parent.colors.preview);
            this.drawTarget();
            ctx.restore();
    }


    callEvent (e){
      
      if (!this.events[e.type]) return;
      
      e.preventDefault();
      this.events[e.type].call(this, e);
        
    }
    
    // currentLine;
    

    // canvas = canvasEl;
    // prefix = this.prefix = $(canvasEl).attr("id");
    // id = 0;
    
    // //canvas.width = maximize ? window.innerWidth : canvasEl.width;
    // //canvas.height = maximize ? window.innerHeight : canvasEl.height;
    
    // ctx = canvasEl.getContext("2d");
    
    // colors = COLORS;
    
    // // the array full of vectors
    // children = [];
    
    push (item){
      
      this.children.push(item);
      this.addToVectorlist(item);
      this.render();
    };
    
    newId(){
      
      id++;
      return id-1;
    };
    
   pop (){
       // todo
      var l = this.children.length;
      if (l === 0) return;
      var c = this.children[l-1];
      this.removeFromVectorlist(c);
      this.children.length = l - 1;
      this.render();
    }; 
    
    render (){
      
      var c = this.children;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        c.forEach(function(val, i, a){
          val.render();
        });
    }

    doneDrawing() {
        dom.stageDrawing.style.display = "none";
    }
}