d3.csv("data/data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    d.Thang = +d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]).getMonth() + 1;
  });

  // Tổng số đơn hàng duy nhất theo tháng
  let donhang_thang = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d.Thang
  );

  // Số đơn hàng duy nhất theo Nhóm hàng + Tháng
  let donhang_nhom_thang = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d.Thang,
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"]
  );

  // Merge dữ liệu thành mảng {Thang, HienThi, XacSuat}
  let merged = [];
  donhang_nhom_thang.forEach(([thang, groups]) => {
    let tong = donhang_thang.find(d => d[0] === thang)[1];
    groups.forEach(([maNhom, tenGroups]) => {
      tenGroups.forEach(([tenNhom, soDH]) => {
        merged.push({
          Thang: thang,
          Nhom: maNhom,
          Ten: tenNhom,
          HienThi: `[${maNhom}] ${tenNhom}`,
          XacSuat: soDH / tong
        });
      });
    });
  });

  // Pivot dữ liệu theo nhóm
  let nested = d3.groups(merged, d => d.HienThi);

  // SVG setup
  const svg = d3.select("#chart8"),
        margin = {top: 40, right: 150, bottom: 50, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
               .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scale
  const x = d3.scaleLinear()
              .domain([1, 12])
              .range([0, width]);

  const y = d3.scaleLinear()
              .domain([0.1, 0.7])
              .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeSet2)
                  .domain(nested.map(d => d[0]));

  // Trục X
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x).ticks(12).tickFormat(d => "T" + String(d).padStart(2,"0")));

  // Trục Y
  g.append("g")
   .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

  // Vẽ line cho từng nhóm
  nested.forEach(([key, values]) => {
    values = values.sort((a,b) => a.Thang - b.Thang);

    g.append("path")
      .datum(values)
      .attr("class", "line")           // gán class
      .attr("fill", "none")            // ❌ fix lỗi bị fill đen
      .attr("stroke", color(key))
      .attr("stroke-width", 2)
      .attr("d", d3.line()
          .x(d => x(d.Thang))
          .y(d => y(d.XacSuat))
      );

    // Marker circle
    g.selectAll(".dot-" + key)
      .data(values)
      .enter().append("circle")
        .attr("cx", d => x(d.Thang))
        .attr("cy", d => y(d.XacSuat))
        .attr("r", 3)
        .attr("fill", color(key));
  });

  // Tiêu đề
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Xác suất bán hàng theo Nhóm hàng và Tháng");

  // Legend
  const legend = svg.append("g")
                    .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);

  nested.forEach(([key], i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 25)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(key));

    legend.append("text")
      .attr("x", 25)
      .attr("y", i * 25 + 14)
      .text(key)
      .style("font-size", "12px");
  });
});
