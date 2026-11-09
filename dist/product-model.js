'use strict';

function mountProductModel(canvas, productId) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Revolved profiles and scaled spheres make the meshes fully rotatable.
  const vertices = [];
  const faces = [];
  const pigments = new Map();
  function pigment(color) {
    if (!pigments.has(color)) pigments.set(color, color.match(/[0-9a-f]{2}/gi).map(channel => parseInt(channel, 16)));
    return pigments.get(color);
  }
  const tau = Math.PI * 2;
  function revolve(profile, segments, position = [0, 0, 0], stretch = [1, 1], turn = 0, asymmetry = 0) {
    const offset = vertices.length;
    const c = Math.cos(turn), s = Math.sin(turn);
    profile.forEach(([radius, height]) => {
      for (let i = 0; i < segments; i++) {
        const angle = i / segments * tau;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const x = radius * cos * stretch[0];
        const z = radius * sin * stretch[1] * (1 + asymmetry * cos);
        vertices.push([position[0] + x*c - z*s, position[1] + height - x*asymmetry*.33, position[2] + x*s + z*c]);
      }
    });
    for (let row = 0; row < profile.length - 1; row++) {
      for (let i = 0; i < segments; i++) {
        const a = offset + row * segments + i;
        const b = offset + row * segments + (i + 1) % segments;
        const indices = profile[row + 1][0] < .000001
          ? [a, a + segments, b]
          : [a, a + segments, b + segments, b];
        faces.push({indices, rgb: pigment(profile[row][2])});
      }
    }
  }

  function oval(x, y, z, width, height, depth, color, turn = 0, segments = 10) {
    const profile = Array.from({length: 7}, (_, i) => {
      const angle = i * Math.PI / 6;
      return [Math.sin(angle), -Math.cos(angle) * height, color];
    });
    revolve(profile, segments, [x, y, z], [width, depth], turn);
  }

  function dish(color) {
    revolve([[0,-.84,color],[.42,-.84,color],[.66,-.76,color],[.92,-.58,color],
      [1.12,-.29,color],[1.14,-.22,'#F3DEBD'],[1.08,-.18,'#F3DEBD'],
      [1.01,-.26,color],[.83,-.47,color],[.55,-.56,color],[0,-.56,color]], 36);
  }

  function grains(count, colors, shape, radius, height) {
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963;
      const distance = radius * Math.sqrt((i + .5) / count);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = -.25 + height * (1 - (distance / radius) ** 2);
      oval(x, y, z, ...shape, colors[i % colors.length], angle, 8);
    }
  }

  function mushroomCap(x, y, z, size, turn) {
    const base = '#F8E3BD', rim = '#DDBB8B', top = '#C49A6B';
    revolve([[0,0,base],[.35*size,.02,base],[.78*size,.04,base],[size,.13,rim],
      [.92*size,.22,top],[.68*size,.31,top],[.35*size,.38,'#DCBC91'],[0,.39,top]],
      24, [x, y, z], [1, .72], turn, .42);
    const c = Math.cos(turn), s = Math.sin(turn);
    for (let i = 0; i < 16; i++) {
      const angle = i / 16 * tau;
      const ribX = Math.cos(angle), ribZ = Math.sin(angle) * .72 * (1 + .42 * ribX);
      const point = (radius, height) => [x + radius * size * (ribX*c - ribZ*s),
        y + height - radius * size * ribX * .42 * .33, z + radius * size * (ribX*s + ribZ*c)];
      const start = vertices.length;
      vertices.push(point(.12, -.012), point(.91, .086), point(.84, .097));
      faces.push({indices: [start, start + 1, start + 2], rgb: pigment('#B98D60')});
    }
  }

  const models = {
    oil() {
      revolve([[0,-1.12,'#AB631D'],[.48,-1.12,'#AB631D'],[.57,-1.03,'#CA7A16'],
        [.58,-.83,'#DEA62B'],[.57,.21,'#EAB839'],[.54,.39,'#DFA524'],
        [.42,.57,'#CE831B'],[.24,.70,'#DFA524'],[.21,1.02,'#B87723'],
        [.24,1.05,'#EFC26A'],[.24,1.12,'#EFC26A'],[0,1.12,'#D69638']], 36);
      revolve([[.19,1.10,'#98643D'],[.22,1.11,'#A8734C'],[.23,1.33,'#C49162'],
        [.19,1.37,'#D9A97C'],[0,1.37,'#D9A97C']], 24);
    },
    honey() {
      revolve([[0,-.91,'#8F4111'],[.64,-.91,'#8F4111'],[.73,-.81,'#9F500F'],
        [.74,-.61,'#BC6518'],[.74,.37,'#C47B1C'],[.68,.49,'#D79938'],
        [.61,.53,'#CE9038'],[.61,.70,'#7F492A'],[.68,.73,'#A96931'],
        [.68,.91,'#BC8546'],[.62,.96,'#DDB371'],[0,.96,'#DDB371']], 36);
    },
    mushroom() {
      dish('#9A6847');
      const bunch = [[-.53,-.32,.33,.64,.2],[.54,-.27,.31,.57,-.43],
        [-.45,.13,-.34,.64,.67],[.4,.21,-.38,.56,-.32],[.02,.51,-.09,.55,.22]];
      bunch.forEach(([x,y,z,size,turn]) => {
        oval(x*.71, (y-.53)/2, z*.71, .15, (y+.66)/2, .15, '#EFE0BB');
        mushroomCap(x, y, z, size, turn);
      });
    },
    turmeric() {
      dish('#986849');
      revolve([[0,-.55,'#DE8C1B'],[.96,-.24,'#E99412'],[.78,-.10,'#F1A417'],
        [.58,.11,'#EB9C16'],[.32,.28,'#F7AF24'],[.09,.36,'#F2A519'],[0,.38,'#F2A519']], 32);
      oval(.50,-.70,.74,.47,.14,.14,'#A6682D',-.45);
      oval(-.18,-.72,1.03,.40,.12,.12,'#BD823F',.31);
      oval(.73,-.67,.85,.13,.12,.10,'#E39A23',-.45);
    },
    dal() {
      dish('#986849');
      revolve([[0,-.55,'#E2AB30'],[.98,-.23,'#E5AE31'],[.68,.02,'#F0C449'],
        [.32,.12,'#F1C64B'],[0,.17,'#F1C64B']], 28);
      grains(54, ['#F3C744','#D99A22','#F7D55C'], [.112,.062,.086], .91, .44);
    },
    rice() {
      dish('#A47452');
      revolve([[0,-.55,'#D9C2A1'],[.97,-.23,'#E3D1B0'],[.68,.04,'#EBDFC8'],
        [.33,.22,'#F7E8D1'],[0,.29,'#F7E8D1']], 28);
      grains(72, ['#FFF0D4','#E5D1AC','#F5E7CD'], [.14,.047,.047], .91, .55);
    }
  };
  if (!models[productId]) return null;
  models[productId]();

  const {width, height} = canvas;
  const tilt = .31, tiltCos = Math.cos(tilt), tiltSin = Math.sin(tilt);
  let yaw = .44, lastPointer, frame;
  const shadow = ctx.createRadialGradient(width/2, height*.81, 9, width/2, height*.81, 150);
  shadow.addColorStop(0, '#73452E48');
  shadow.addColorStop(1, '#73452E00');

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, height*.81);
    ctx.scale(1, .25);
    ctx.translate(0, -height*.81);
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const projected = vertices.map(([x,y,z]) => {
      const rotatedZ = x*s + z*c;
      const px = x*c - z*s;
      const py = y*tiltCos - rotatedZ*tiltSin;
      const pz = y*tiltSin + rotatedZ*tiltCos;
      const scale = 125 * 5 / (5 - pz);
      return {x:px,y:py,z:pz,screenX:width/2 + px*scale,screenY:height*.51 - py*scale};
    });
    const polygons = faces.map(({indices,rgb}) => {
      const points = indices.map(index => projected[index]);
      return {points,rgb,depth:points.reduce((sum, point) => sum + point.z, 0) / points.length};
    }).sort((a,b) => a.depth - b.depth);

    polygons.forEach(({points,rgb}) => {
      const [a,b,c] = points;
      const ab = [b.x-a.x,b.y-a.y,b.z-a.z], ac = [c.x-a.x,c.y-a.y,c.z-a.z];
      const nx = ab[1]*ac[2] - ab[2]*ac[1];
      const ny = ab[2]*ac[0] - ab[0]*ac[2];
      const nz = ab[0]*ac[1] - ab[1]*ac[0];
      const normal = Math.hypot(nx, ny, nz);
      if (normal < .0000001) return;
      const light = Math.max(0, (-nx*.55 + ny*.68 + nz*.48) / normal);
      const shade = .64 + light*.44;
      const channels = rgb.map(channel => Math.min(255, Math.round(channel * shade)));
      const fill = 'rgb(' + channels.join(',') + ')';
      ctx.beginPath();
      ctx.moveTo(a.screenX,a.screenY);
      points.slice(1).forEach(point => ctx.lineTo(point.screenX,point.screenY));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = fill;
      ctx.lineWidth = .65;
      ctx.stroke();
      ctx.fill();
    });
  }

  function rotate(step) {
    yaw = (yaw + step * .26) % tau;
    if (!frame) frame = requestAnimationFrame(() => {
      frame = null;
      draw();
    });
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    lastPointer = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (lastPointer === undefined || !canvas.hasPointerCapture(event.pointerId)) return;
    rotate((event.clientX - lastPointer) / 25);
    lastPointer = event.clientX;
  });
  canvas.addEventListener('lostpointercapture', () => { lastPointer = undefined; });
  draw();
  return {rotate};
}
