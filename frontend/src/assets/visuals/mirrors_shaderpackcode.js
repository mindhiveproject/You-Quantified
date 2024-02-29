export function spCode() {

  return `
  setMaxIterations(8);

  let valor=input();
  let click = input();
	let buttonHover = input();

  let offset = 0.5; // input(0.08, 0, 0.1);
  // this function defines color
  function fbm(p) {
    return vec3(
      noise(p),
      noise(p+offset),
      noise(p+offset),
    )
  }
  
  let s = getRayDirection();
  //let n = sin(fbm(s+vec3(0, 0, -5*.1))*2)*.5+.75;
  let n = (fbm(s+vec3(0, 0, -time*valor*.1))*2)*.5+.75;

  n = pow(n, vec3(8));
  color(n)
  let scale =.5+n.x*.05;
	shape(() => {
    // this could be your face/nose position
		rotateX(PI/2);
		// rotateX(mouse.x* click)
		// rotateZ(-1*mouse.y* click)
		//where you change
		torus(scale, .2)
		reset();
		mixGeo(click)
		
		sphere(scale);
	})()
  //blend(.4)
  //displace(mouse.x*2, mouse.y, 0)
  //sphere(.2)
  `;
}