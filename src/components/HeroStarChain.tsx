import { useEffect, useRef } from "react";

const COLORS = ["#7df8ff","#a78bfa","#f472b6","#fbbf24","#34d399","#60a5fa","#fb923c","#e879f9","#4ade80","#f87171","#22d3ee","#a3e635"];

export default function HeroStarChain({ lang }: { lang: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/articles/public").then(r => r.json()).then(articles => {
      const canvas = canvasRef.current;
      if (!canvas || !articles?.length) return;
      const ctx = canvas.getContext("2d")!;
      const list = articles.slice(0, 12);
      const W = canvas.width = canvas.offsetWidth * 2;
      const H = canvas.height = canvas.offsetHeight * 2;
      const cx = W / 2, cy = H / 2;

      // Nodes
      const nodes = list.map((a: any, i: number) => {
        const angle = (2 * Math.PI * i) / list.length;
        const orbit = Math.min(W, H) * 0.28;
        return {
          x: cx + Math.cos(angle) * orbit,
          y: cy + Math.sin(angle) * orbit * 0.55,
          r: 5 + Math.random() * 7, color: COLORS[i % COLORS.length],
          article: a, angle, orbit, speed: 0.0003 + Math.random() * 0.0004, vx: 0, vy: 0,
        };
      });

      // Edges based on shared tags
      const edges: [number, number][] = [];
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++)
          if (nodes[i].article.tags?.filter((t: string) => nodes[j].article.tags?.includes(t)).length > 0)
            edges.push([i, j]);

      // Particles
      const pts = Array.from({ length: 100 }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2,
        o: Math.random() * 0.5 + 0.1, s: 0.05 + Math.random() * 0.2,
      }));

      let hovered: number | null = null, time = 0;

      canvas.onmousemove = (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * 2, my = (e.clientY - r.top) * 2;
        hovered = null;
        for (let i = 0; i < nodes.length; i++) {
          const dx = nodes[i].x - mx, dy = nodes[i].y - my;
          if (Math.sqrt(dx * dx + dy * dy) < nodes[i].r * 3.5) { hovered = i; break; }
        }
        canvas.style.cursor = hovered !== null ? "pointer" : "default";
      };

      canvas.onclick = () => {
        if (hovered !== null) {
          const a = nodes[hovered].article;
          window.location.href = `/${lang}/notes/db/${a.slug}/`;
        }
      };

      function draw() {
        time++;
        ctx.clearRect(0, 0, W, H);
        // Nebula bg
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
        bg.addColorStop(0, "rgba(15,25,60,0.25)"); bg.addColorStop(1, "rgba(0,0,8,0)");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // Particles
        for (const p of pts) {
          p.y -= p.s; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
          const tw = Math.sin(time * 0.04 + p.x * 0.1) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255,255,255,${p.o * tw})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }

        // Update
        for (const n of nodes) {
          n.angle += n.speed;
          const tx = cx + Math.cos(n.angle) * n.orbit, ty = cy + Math.sin(n.angle) * n.orbit * 0.55;
          n.vx += (tx - n.x) * 0.004; n.vy += (ty - n.y) * 0.004;
          n.vx *= 0.96; n.vy *= 0.96; n.x += n.vx; n.y += n.vy;
        }

        // Edges
        for (const [i, j] of edges) {
          const a = nodes[i], b = nodes[j];
          const hl = hovered === i || hovered === j;
          ctx.strokeStyle = `rgba(255,255,255,${hl ? 0.6 : 0.08})`;
          ctx.lineWidth = hl ? 2 : 0.4;
          ctx.setLineDash(hl ? [] : [2, 5]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
        }

        // Nodes
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const hl = hovered === i;
          const r = hl ? n.r * 2.3 : n.r * 1.2;
          const pulse = Math.sin(time * 0.05 + i) * 0.3 + 0.7;

          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
          g.addColorStop(0, hl ? n.color : `${n.color}88`); g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.globalAlpha = hl ? 1 : 0.4 * pulse;
          ctx.beginPath(); ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;

          const body = ctx.createRadialGradient(n.x - r * 0.2, n.y - r * 0.2, r * 0.05, n.x, n.y, r);
          body.addColorStop(0, "#fff"); body.addColorStop(0.35, n.color); body.addColorStop(1, `${n.color}55`);
          ctx.fillStyle = body;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();

          ctx.strokeStyle = `${n.color}28`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.ellipse(n.x, n.y, r * 2.2, r * 1.5, time * 0.008 + i, 0, Math.PI * 2); ctx.stroke();

          if (hl) {
            const label = n.article.title.slice(0, 10);
            ctx.font = "bold 11px sans-serif";
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = "rgba(0,0,0,0.75)";
            ctx.beginPath(); ctx.roundRect(n.x - tw / 2 - 8, n.y + r + 5, tw + 16, 20, 10); ctx.fill();
            ctx.strokeStyle = n.color; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(n.x - tw / 2 - 8, n.y + r + 5, tw + 16, 20, 10); ctx.stroke();
            ctx.fillStyle = "#fff"; ctx.fillText(label, n.x - tw / 2, n.y + r + 19);
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    });
  }, [lang]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 6, pointerEvents: "auto" }} />;
}
