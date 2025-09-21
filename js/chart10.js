// js/chart10.js  — Câu 10
// Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo từng Tháng

d3.csv("data/data.csv").then(function (raw) {
  // 1) Chuẩn hóa & sinh cột Tháng
  const parse = d3.timeParse("%Y-%m-%d %H:%M:%S");
  raw.forEach(d => {
    const t = parse(d["Thời gian tạo đơn"]);
    d.__month = t ? (t.getMonth() + 1) : null; // 1..12
    d.__maDon = d["Mã đơn hàng"];
    d.__nhomMa = d["Mã nhóm hàng"];
    d.__nhomTen = d["Tên nhóm hàng"];
    d.__mhMa   = d["Mã mặt hàng"];
    d.__mhTen  = d["Tên mặt hàng"];
  });

  // Lọc bản ghi hợp lệ có tháng
  const data = raw.filter(d => d.__month != null);

  // 2) Đếm số đơn hàng uniq theo Nhóm + Tháng
  const groupMonthSets = new Map();
  for (const d of data) {
    const key = `${d.__month}|${d.__nhomMa}|${d.__nhomTen}`;
    if (!groupMonthSets.has(key)) groupMonthSets.set(key, new Set());
    groupMonthSets.get(key).add(d.__maDon);
  }

  // 3) Đếm số đơn hàng uniq theo Mặt hàng trong Nhóm + Tháng
  const itemMonthSets = new Map();
  for (const d of data) {
    const key = `${d.__month}|${d.__nhomMa}|${d.__nhomTen}|${d.__mhMa}|${d.__mhTen}`;
    if (!itemMonthSets.has(key)) itemMonthSets.set(key, new Set());
    itemMonthSets.get(key).add(d.__maDon);
  }

  // 4) Tạo bảng TyLe cho từng item trong từng nhóm theo từng tháng
  const records = [];
  itemMonthSets.forEach((setItem, key) => {
    const [m, nhMa, nhTen, mhMa, mhTen] = key.split("|");
    const totalKey = `${m}|${nhMa}|${nhTen}`;
    const total = groupMonthSets.has(totalKey) ? groupMonthSets.get(totalKey).size : 0;
    const itemC = setItem.size;
    const tyle = total > 0 ? (itemC / total) : 0; // 0..1
    records.push({
      Thang: +m,
      NhomMa: nhMa,
      NhomTen: nhTen,
      MhMa: mhMa,
      MhTen: mhTen,
      HienThi: `[${mhMa}] ${mhTen}`,
      TyLe: tyle
    });
  });

  // 5) Gom theo Nhóm hàng => mỗi subplot 1 nhóm
  const groups = d3.groups(records, d => d.NhomTen, d => d.MhMa + "|" + d.MhTen);

  // 6) Setup SVG grid 3 cột
  const svg = d3.select("#chart10");
  const W = +svg.attr("width");
  const H = +svg.attr("height");

  const cols = 3;
  const padTop = 40, padLeft = 40, padRight = 20, padBottom = 30;
  const subW = (W - padLeft - padRight) / cols;
  const rows = Math.ceil(groups.length / cols);
  const subH = (H - padTop - padBottom) / rows;

  // Tiêu đề chung
  svg.append("text")
     .attr("x", W / 2)
     .attr("y", 24)
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .style("font-weight", "bold")
     .text("Câu 10 - Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo từng Tháng");

  // 7) Vẽ từng subplot
  groups.forEach(([nhomTen, itemArr], idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const g = svg.append("g")
      .attr("transform", `translate(${padLeft + col * subW}, ${padTop + row * subH})`);

    // Trục X: tháng 1..12
    const x = d3.scalePoint()
      .domain(d3.range(1, 13))
      .range([40, subW - 20])
      .padding(0.5);

    // Chuẩn hóa dữ liệu dạng series theo tháng (điền 0 nếu thiếu tháng)
    const series = itemArr.map(([mhKey, recs]) => {
      const [mhMa, mhTen] = mhKey.split("|");
      const label = `[${mhMa}] ${mhTen}`;
      const byMonth = new Map(recs.map(r => [r.Thang, r.TyLe]));
      const pts = d3.range(1, 13).map(m => ({
        Thang: m,
        TyLe: byMonth.get(m) ?? 0
      }));
      return { label, points: pts };
    });

    // Lấy mã nhóm
    let nhomMa = "";
    for (const [, recs] of itemArr) {
      if (recs && recs.length) {
        nhomMa = recs[0].NhomMa;
        break;
      }
    }

    // Y domain: chỉnh riêng cho từng nhóm
    let yDomain;
    if (nhomMa === "BOT") {
      yDomain = [0, 2.0]; // 0–100%
    } else if (nhomMa === "SET") {
      yDomain = [0.05, 0.25]; // 0–25%
    } else if (nhomMa === "THO") {
      yDomain = [0.1, 0.35]; // 0–35%
    } else if (nhomMa === "TTC") {
      yDomain = [0.25, 0.8]; // 0–70%
    } else if (nhomMa === "TMX") {
      yDomain = [0.25, 0.55]; // 0–50%
    } else {
      // auto nếu chưa định nghĩa
      const yMax = d3.max(series.flatMap(s => s.points.map(p => p.TyLe))) || 0;
      yDomain = [0, Math.max(0.001, yMax * 1.1)];
    }

    const y = d3.scaleLinear()
      .domain(yDomain)
      .range([subH - 40, 20]);

    // Trục
    g.append("g")
      .attr("transform", `translate(0,${subH - 40})`)
      .call(d3.axisBottom(x).tickFormat(m => `T${String(m).padStart(2, "0")}`));

    g.append("g")
      .attr("transform", `translate(40,0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

    // Tiêu đề nhỏ
    g.append("text")
      .attr("x", (subW - 60) / 2 + 40)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .text(`[${nhomMa}] ${nhomTen}`);

    // Màu cho từng mặt hàng trong nhóm
    const color = d3.scaleOrdinal()
      .domain(series.map(s => s.label))
      .range(series.map((_, i) => d3.interpolateSpectral(i / Math.max(1, (series.length - 1)))));

    // Line generator
    const line = d3.line()
      .x(d => x(d.Thang))
      .y(d => y(d.TyLe));

    // Vẽ line + điểm + tooltip
    series.forEach(s => {
      g.append("path")
        .attr("fill", "none")
        .attr("stroke", color(s.label))
        .attr("stroke-width", 2)
        .attr("d", line(s.points));

      g.selectAll(null)
        .data(s.points)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Thang))
        .attr("cy", d => y(d.TyLe))
        .attr("r", 2.5)
        .attr("fill", color(s.label))
        .append("title")
        .text(d => `${s.label}\nTháng: T${String(d.Thang).padStart(2, "0")}\nTỷ lệ: ${(d.TyLe * 100).toFixed(2)}%`);
    });
  });
}).catch(err => {
  console.error("C10 error:", err);
});
