d3.csv("data/data.csv").then(function(data) {
  // Ép kiểu dữ liệu
  data.forEach(d => {
    d.SL = +d["SL"];
    d.ThanhTien = +d["Thành tiền"];
    d.Ngay = new Date(d["Thời gian tạo đơn"]);
    d.NgayTrongThang = d.Ngay.getDate();
  });

  // --- B1: Tổng doanh thu & SKU theo từng ngày (group theo full date) ---
  let daily = d3.rollup(
    data,
    v => ({
      TongDoanhThu: d3.sum(v, d => d.ThanhTien),
      TongSKU: d3.sum(v, d => d.SL)
    }),
    d => d.Ngay.toDateString()
  );

  let dailyArr = [];
  daily.forEach((val, key) => {
    let ngay = new Date(key);
    dailyArr.push({
      Ngay: ngay,
      NgayTrongThang: ngay.getDate(),
      TongDoanhThu: val.TongDoanhThu,
      TongSKU: val.TongSKU
    });
  });

  // --- B2: Tính trung bình theo Ngày trong tháng ---
  let groupedMap = d3.rollup(
    dailyArr,
    v => ({
      DoanhThuTB: d3.mean(v, d => d.TongDoanhThu),
      SKUTB: d3.mean(v, d => d.TongSKU)
    }),
    d => d.NgayTrongThang
  );

  let grouped = [];
  groupedMap.forEach((val, day) => {
    grouped.push({
      Ngay: day,
      DoanhThuTB: val.DoanhThuTB,
      SKUTB: val.SKUTB,
      HienThi: "Ngày " + day
    });
  });

  // Sắp xếp 1 -> 31
  grouped.sort((a, b) => d3.ascending(a.Ngay, b.Ngay));

  // --- B3: Vẽ biểu đồ ---
  const svg = d3.select("#chart5"),
        margin = {top: 40, right: 50, bottom: 100, left: 100},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
               .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
              .domain(grouped.map(d => d.HienThi))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(grouped, d => d.DoanhThuTB)])
              .nice()
              .range([height, 0]);

  // Màu
  const color = d3.scaleOrdinal(d3.schemeSpectral[grouped.length] || d3.schemeSet3);

  // Trục X
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x))
   .selectAll("text")
     .attr("transform", "rotate(45)")
     .style("text-anchor", "start");

  // Trục Y (triệu VND)
  g.append("g")
   .call(d3.axisLeft(y).tickFormat(d => (d/1e6).toFixed(0) + "M"));

  // Vẽ cột
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("x", d => x(d.HienThi))
      .attr("y", d => y(d.DoanhThuTB))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThuTB))
      .attr("fill", d => color(d.Ngay))
      .append("title")
        .text(d => `${d.HienThi}\nDoanh thu TB: ${d3.format(",.0f")(d.DoanhThuTB)} VND\nSKU TB: ${Math.round(d.SKUTB)}`);

  // Nhãn
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.HienThi) + x.bandwidth() / 2)
      .attr("y", d => y(d.DoanhThuTB) - 5)
      .attr("text-anchor", "middle")
      .text(d => (d.DoanhThuTB / 1e6).toFixed(1) + "M")
      .style("font-size", "10px") 

  // Tiêu đề
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Doanh số bán hàng theo Ngày trong tháng (TB)");
});
