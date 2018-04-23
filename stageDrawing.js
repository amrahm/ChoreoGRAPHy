//TODO We need a way to get back to this state
/** Implements drawing a custom stage */
class StageDrawing extends EventTarget {

    // constructor
    // constructor() {
    //     this.stage = new Path2D();
    // }

    // COLORS  = {
    //     "preview": "#0c8",
    //     "stroke": "#363636",
    //     "anchor": "#0cc"
    //   };

    // Line(parent, x1, y1, x2, y2){
    
    //     var id = parent.newId();
    //     this.__id = id;
    //     this.id = parent.prefix + "-" + id;
    //     this.anchorWidth = 5;
    //     this.type = "line";
    //     this.parent = parent;
    //     var canvas = parent.canvas,
    //         ctx = parent.ctx;
        
    //     this.origin = {};
    //     this.target = {};
        
        
    //     this.origin.x = x1 || 0;
    //     this.origin.y = y1 || 0;
        
    //     this.target.x = x2 || x1;
    //     this.target.y = y2 || y1;
        
    //     this.hidden = false;
        
    //     this.anchor = function(x,y){
          
    //       var n = this.anchorWidth /2;
    //       ctx.globalCompositeOperation = "lighter";
    //       ctx.strokeStyle = this.parent.colors.anchor;
    //       ctx.strokeRect(x - n, y - n, n*2, n*2);
    //       ctx.globalCompositeOperation = "source-over";
    //     };
        
    //     this.drawOrigin = function(){
          
    //       this.anchor(this.origin.x, this.origin.y);
    //     };
        
    //     this.drawTarget = function(){
          
    //       this.anchor(this.target.x, this.target.y);
    //     };
        
    //     this.to = function(x, y){
          
    //       // allow passing in of single parameters
    //       this.target.x = x !== undefined ? x : this.target.x;
    //       this.target.y = y !== undefined ? y : this.target.y;
    //     };
     
        
    //     this.render = function(c){
          
    //       // c passed in for previewing.
    //       if (c === undefined && this.hidden) return;
          
    //       ctx.strokeStyle = c || this.parent.colors.stroke;
    
    //       ctx.beginPath();
    //       var p = new Path2D();
    //       p.moveTo(this.origin.x, this.origin.y);
    //       p.lineTo(this.target.x, this.target.y);
    //       p.stroke();
    //       this.path = p;
    //       console.log(p);
    //     }; 
        
    //     this.preview = function(){
          
    //       ctx.save();
    //       ctx.clearRect(0, 0, canvas.width, canvas.height);
    //       this.parent.render();
    //       this.drawOrigin();
    //       this.render(this.parent.colors.preview);
    //       this.drawTarget();
    //       ctx.restore();
    //     }; 
    // };
    
    doneDrawing(){
        dom.stageDrawing.style.display = "none";
    }
}