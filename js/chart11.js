// js/chart11.js — Câu 11
// Phân phối mức độ mua lặp lại của khách hàng

d3.csv("data/data.csv").then(function (rows) {
  const KH_COL = "Mã khách hàng";
  const DH_COL = "Mã đơn hàng";

  // Gom đơn hàng theo khách hàng
  const custToOrders = new Map();
  rows.forEach(d => {
    const kh = d[KH_COL];
    const dh = d[DH_COL];
    if (!kh || !dh) return;
    if (!custToOrders.has(kh)) custToOrders.set(kh, new Set());
    custToOrders.get(kh).add(dh);
  });

  // Đếm số lần mua lại
  const freq = new Map();
  custToOrders.forEach(set => {
    const count = set.size;
    freq.set(count, (freq.get(count) || 0) + 1);
  });

  const data = Array.from(freq, ([repeat, customers]) => ({
    repeat: +repeat,
    customers: +customers
  })).sort((a, b) => a.repeat - b.repeat);

  const svg = d3.select("#chart11");
  const W = +svg.attr("width");
  const H = +svg.attr("height");
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.repeat))
    .range([0, innerW])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.customers) * 1.1])
    .nice()
    .range([innerH, 0]);

  // Trục
  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  // Vẽ bar + tooltip
  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.repeat))
    .attr("y", d => y(d.customers))
    .attr("width", x.bandwidth())
    .attr("height", d => innerH - y(d.customers))
    .attr("fill", "skyblue")
    .attr("stroke", "black")
    .append("title")   // ✅ Tooltip như câu 1-6
    .text(d => `Số lần mua: ${d.repeat}\nSố KH: ${d.customers}`);

  // Nhãn trên cột
  g.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => x(d.repeat) + x.bandwidth() / 2)
    .attr("y", d => y(d.customers) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .text(d => d.customers);

  // Tiêu đề & nhãn trục
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Phân phối mức độ mua lặp lại của khách hàng");

  svg.append("text")
    .attr("x", W / 2)
    .attr("y", H - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Số lần mua lặp lại");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Số lượng khách hàng");

  // Grid ngang
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");
});
