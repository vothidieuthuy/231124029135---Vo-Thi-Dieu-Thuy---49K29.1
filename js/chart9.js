d3.csv("data/data.csv").then(function(data) {
  // --- Chuẩn hóa dữ liệu ---
  let grouped = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"],
    d => d["Mã mặt hàng"],
    d => d["Tên mặt hàng"]
  );

  let merged = [];
  grouped.forEach(([maNhom, tenNhomGroups]) => {
    tenNhomGroups.forEach(([tenNhom, maMHGroups]) => {
      let tong = 0;
      maMHGroups.forEach(([maMH, tenMHGroups]) => {
        tenMHGroups.forEach(([tenMH, soDH]) => {
          tong += soDH;
        });
      });
      maMHGroups.forEach(([maMH, tenMHGroups]) => {
        tenMHGroups.forEach(([tenMH, soDH]) => {
          merged.push({
            Nhom: maNhom,
            TenNhom: tenNhom,
            MaMH: maMH,
            TenMH: tenMH,
            HienThi: `[${maMH}] ${tenMH}`,
            XacSuat: soDH / tong
          });
        });
      });
    });
  });

  // --- Gom nhóm theo Nhóm hàng ---
  const groupedByNhom = d3.groups(merged, d => d.TenNhom);

  // --- SVG chia grid ---
  const svg = d3.select("#chart9"),
        totalWidth = +svg.attr("width"),
        totalHeight = +svg.attr("height");

  const cols = 3;   // số cột subplot
  const rows = Math.ceil(groupedByNhom.length / cols);
  const cellWidth = totalWidth / cols;
  const cellHeight = totalHeight / rows;

  // --- Vẽ từng subplot ---
  groupedByNhom.forEach(([tenNhom, arr], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const g = svg.append("g")
      .attr("transform", `translate(${col * cellWidth + 60},${row * cellHeight + 60})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(arr, d => d.XacSuat)])
      .range([0, cellWidth - 120]);

    const y = d3.scaleBand()
      .domain(arr.sort((a, b) => d3.descending(a.XacSuat, b.XacSuat)).map(d => d.HienThi))
      .range([0, cellHeight - 100])
      .padding(0.2);

    // 🎨 Thang màu riêng cho từng mặt hàng
    const color = d3.scaleOrdinal()
      .domain(arr.map(d => d.HienThi))
      .range(arr.map((d, i) => d3.interpolateSpectral(i / (arr.length - 1))));

    // Trục X
    g.append("g")
      .attr("transform", `translate(0,${cellHeight - 100})`)
      .call(d3.axisBottom(x).tickFormat(d3.format(".0%")).ticks(5));

    // Trục Y
    g.append("g").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

    // Bar + Tooltip
    g.selectAll("rect")
      .data(arr)
      .enter().append("rect")
        .attr("y", d => y(d.HienThi))
        .attr("width", d => x(d.XacSuat))
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.HienThi))
      .append("title")   // ✅ Tooltip dạng SVG (giống câu 1-6)
        .text(d => `${d.HienThi}\nXác suất: ${(d.XacSuat*100).toFixed(2)}%`);

    // Label %
    g.selectAll("text.value")
      .data(arr)
      .enter().append("text")
        .attr("class", "value")
        .attr("x", d => x(d.XacSuat) + 5)
        .attr("y", d => y(d.HienThi) + y.bandwidth()/2 + 4)
        .text(d => d3.format(".0%")(d.XacSuat))
        .style("font-size", "11px");

    // Sub-title
    g.append("text")
      .attr("class", "sub-title")
      .attr("x", (cellWidth - 100) / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text(`[${arr[0].Nhom}] ${tenNhom}`);
  });

  // --- Tiêu đề chung ---
  svg.append("text")
    .attr("x", totalWidth / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng theo Mặt hàng trong từng Nhóm hàng");
});
