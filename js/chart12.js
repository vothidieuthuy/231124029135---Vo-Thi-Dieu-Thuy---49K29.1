// js/chart12.js — Câu 12
// Phân phối số tiền khách hàng đã chi trả cho doanh nghiệp

d3.csv("data/data.csv").then(function (rows) {
  const KH_COL = "Mã khách hàng";
  const MONEY_COL = "Thành tiền";

  // 1. Gom tổng chi tiêu của mỗi khách hàng
  const custSpend = d3.rollup(
    rows,
    v => d3.sum(v, d => +d[MONEY_COL] || 0),
    d => d[KH_COL]
  );
  const spending = Array.from(custSpend.values());

  if (spending.length === 0) {
    console.warn("Không có dữ liệu chi tiêu khách hàng");
    return;
  }

  // 2. Đặt bin size = 50,000
  const binSize = 50000;
  const maxVal = d3.max(spending);
  const bins = d3.bin()
    .domain([0, maxVal])
    .thresholds(d3.range(0, maxVal + binSize, binSize))(spending);

  // 3. Setup SVG
  const svg = d3.select("#chart12");
  const W = +svg.attr("width");
  const H = +svg.attr("height");
  const margin = { top: 40, right: 30, bottom: 60, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // 4. Thang đo
  const x = d3.scaleLinear()
    .domain([0, maxVal])
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([innerH, 0]);

  // 5. Trục X dạng "k"
  const xticks = d3.range(0, maxVal + 200000, 200000); // tick 200k
  const xAxis = d3.axisBottom(x)
    .tickValues(xticks)
    .tickFormat(d => `${d / 1000}k`);

  // 6. Vẽ cột histogram + tooltip
  g.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => innerH - y(d.length))
    .attr("fill", "skyblue")
    .attr("stroke", "black")
    .attr("opacity", 0.7)
    .append("title")   // ✅ Tooltip giống câu 1–6
    .text(d => {
      const from = (d.x0 / 1000) + "k";
      const to = (d.x1 / 1000) + "k";
      return `Khoảng: ${from} – ${to}\nSố KH: ${d.length}`;
    });

  // 7. Trục X & Y
  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(xAxis);

  g.append("g").call(d3.axisLeft(y));

  // 8. Grid ngang
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");

  // 9. Label trục
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", H - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Số tiền chi trả (VNĐ)");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Số lượng khách hàng");

  // 10. Tiêu đề
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Phân phối số tiền khách hàng đã chi trả cho doanh nghiệp");
});
