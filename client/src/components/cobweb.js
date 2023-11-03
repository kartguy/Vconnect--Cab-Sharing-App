import React from "react";
import Proton from "proton-engine";
import RAFManager from "raf-manager";
import Canvas from "./Canvas.jsx";
import { getColor } from "../utils/Color";

export default class Cobweb extends React.Component {
  constructor(props) {
    super(props);
    this.renderProton = this.renderProton.bind(this);
  }

  onCanvasInited(canvas, width, height) {
    this.createProton(canvas, width, height);
    RAFManager.add(this.renderProton);
  }

  componentWillUnmount() {
    try {
      RAFManager.remove(this.renderProton);
      this.proton.destroy();
    } catch (e) {}
  }

  onResize(width, height) {
    this.crossZoneBehaviour.zone.width = width;
    this.crossZoneBehaviour.zone.height = height;
    this.proton.renderers[0].resize(width, height);
  }

  createProton(canvas, width, height) {
    this.proton = new Proton();

    const emitter = new Proton.Emitter();
    emitter.rate = new Proton.Rate(
      this.props.num ? new Proton.Span(this.props.num) : new Proton.Span(100),
      new Proton.Span(0.05, 0.2)
    );

    emitter.addInitialize(new Proton.Mass(1));
    emitter.addInitialize(new Proton.Radius(1, 4));
    emitter.addInitialize(new Proton.Life(Infinity));

    const pointZone = new Proton.Position(
      new Proton.RectZone(0, 0, width, height)
    );
    emitter.addInitialize(pointZone);
    emitter.addInitialize(
      new Proton.Velocity(
        new Proton.Span(0.3, 0.6),
        new Proton.Span(0, 360),
        "polar"
      )
    );

    emitter.addBehaviour(new Proton.Alpha(Proton.getSpan(0.2, 0.9)));
    emitter.addBehaviour(new Proton.Color(this.props.color || "#333"));
    this.crossZoneBehaviour = new Proton.CrossZone(
      new Proton.RectZone(0, 0, width, height),
      "cross"
    );
    emitter.addBehaviour(this.crossZoneBehaviour);

    emitter.emit("once");
    emitter.damping = 0;
    this.proton.addEmitter(emitter);
    this.proton.addRenderer(this.createRenderer(canvas, emitter));
  }

  createRenderer(canvas, emitter) {
    const context = canvas.getContext("2d");
    const renderer = new Proton.CanvasRenderer(canvas);
    const R = 140;

    renderer.onProtonUpdateAfter = ()=> {
      let particles = emitter.particles;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          let pA = particles[i];
          let pB = particles[j];
          let dis = pA.p.distanceTo(pB.p);

          if (dis < R) {
            let alpha = (1 - dis / R) * 0.5;
            context.strokeStyle = getColor(this.props.color, alpha) || `rgba(3, 3, 3, ${alpha})`;
            context.beginPath();
            context.moveTo(pA.p.x, pA.p.y);
            context.lineTo(pB.p.x, pB.p.y);
            context.closePath();
            context.stroke();
          }
        }
      }
    };

    return renderer;
  }

  renderProton() {
    this.proton && this.proton.update();
  }

  render() {
    return (
      <Canvas bg={this.props.bg}
        globalCompositeOperation="darker"
        onCanvasInited={this.onCanvasInited.bind(this)}
        onResize={this.onResize.bind(this)}
      />
    );
  }
}