//d3.json("mockdata/feed.json")
//d3.json("https://api.nasa.gov/neo/rest/v1/feed?start_date=2021-04-08&end_date=2021-04-14&api_key=DEMO_KEY")
const now = moment().format("YYYY-MM-DD");
const weekago = moment().subtract(6, 'days').format("YYYY-MM-DD");
const request = "https://api.nasa.gov/neo/rest/v1/feed?start_date="+weekago+"&end_date="+now+"&api_key=DEMO_KEY";
//console.log(request);
d3.json(request)
    .then((data) => {
        // console.log(data);
        load_vis(data.near_earth_objects);
    })
    .catch((error) => {
        console.error("Load error");
    });

var selected_day = 6;
var weekly = [];

function feed_preparation(near_earth_objects) {

    for(const [key, value] of Object.entries(near_earth_objects)) {
        let thisdate = moment(key, "YYYY-MM-DD");

        let day = {
            date: thisdate,
            dayname: moment(thisdate).format('ddd'),
            daily: [],
        };
        
        value.forEach(function(el) {
            if(el.close_approach_data.length != 1)
                console.error("WARNING: close approach data length = "+el.close_approach_data.length+" for object name "+el.name);
            
            let approach = el.close_approach_data[el.close_approach_data.length-1]; // hey! should this be the approach with the latest date? -- for now it seems this is safe and this vector is always of one element.
            day.daily.push({
                velocity: Number(approach.relative_velocity.kilometers_per_second),
                distance: Number(approach.miss_distance.astronomical),
                diameter: Number((el.estimated_diameter.kilometers.estimated_diameter_min + el.estimated_diameter.kilometers.estimated_diameter_max) / 2.0),
                magnitude: Number(el.absolute_magnitude_h),
                name: el.name,
            });
        });

        weekly.push(day);
    }

    weekly.sort(function(a, b) {
        if(a.date < b.date) return -1;
        if(a.date > b.date) return 1;
        return 0;
    });
    
    for(let i = 0; i < weekly.length; i++)
        weekly[i].index = i;

    //console.log(weekly);
}

const pad_w = 50;
const day_w = 1120;
const mag_w = 330;

const pad_h = 50;
const leg_h = 150;
const vis_h = 700;

const total_w = (pad_w * 3) + day_w + mag_w;
const total_h = (pad_h * 3) + leg_h + vis_h;

const day_leg_x = pad_w;
const day_leg_y = pad_h;

const day_vis_x = pad_w;
const day_vis_y = (2 * pad_h) + leg_h;

const mag_leg_x = (2 * pad_w) + day_w;
const mag_leg_y = pad_h;

const mag_vis_x = (2 * pad_w) + day_w;
const mag_vis_y = (2 * pad_h) + leg_h;

const daymag_boundary_x = pad_w + day_w + (pad_w / 2);
const legvis_boundary_y = pad_h + leg_h + (pad_h / 2);

const day_min_diameter = 5;
const day_max_diameter = vis_h / 9.5;
const day_min_vel_pos = day_max_diameter;
const day_max_vel_pos = day_w - day_max_diameter;
const day_min_dis_pos = day_max_diameter;
const day_max_dis_pos = vis_h - day_max_diameter;

const duration = 800;
const easing = d3.easePoly;

function load_daily(sel) {
    sel.append("line")
        .attr("x1", "0%")
        .attr("y1", "2%")
        .attr("x2", "100%")
        .attr("y2", "2%")
        .attr("class", "dailyline")
    ;
    sel.append("line")
        .attr("x1", "0%")
        .attr("y1", "33%")
        .attr("x2", "100%")
        .attr("y2", "33%")
        .attr("class", "dailyline")
    ;
    sel.append("line")
        .attr("x1", "0%")
        .attr("y1", "66%")
        .attr("x2", "100%")
        .attr("y2", "66%")
        .attr("class", "dailyline")
    ;
    sel.append("line")
        .attr("x1", "0%")
        .attr("y1", "98%")
        .attr("x2", "100%")
        .attr("y2", "98%")
        .attr("class", "dailyline")
    ;

    // STATIC LEGENDS
    // (warning: these should be properly grouped!)

    sel.append("text")
        .attr("x", 30)
        .attr("y", "96%")
        .attr("class","legend-text")
        .text("DISTANCE (au)");

    sel.append("text")
        .attr("x", 30)
        .attr("y", "101.5%")
        .attr("class","legend-text")
        .text("VELOCITY (km/s)");

    
}

function update_daily(sel) {
    let daily = weekly[selected_day].daily;

    let velocityExtent = d3.extent(daily.map(e => e.velocity));
    let distanceExtent = d3.extent(daily.map(e => e.distance));
    var diameterScale = d3.scaleLinear()
        .domain([0.0001,1])
        .range([day_min_diameter,day_max_diameter]);
    var velocityScale = d3.scaleLinear()
        .domain(velocityExtent)
        .range([day_min_vel_pos,day_max_vel_pos]);
    var distanceScale = d3.scaleLinear()
        .domain(distanceExtent)
        .range([day_max_dis_pos,day_min_dis_pos]);

    let gsel = sel.selectAll(".asteroidgroup")
        .data(daily);

    let gsel_exit = gsel.exit();
    gsel_exit.selectAll(".asteroid-outer")
        .transition().ease(easing).duration(duration).attr("r", 0);
    gsel_exit
        .transition().ease(easing).duration(duration)
        .remove();

    let gsel_enter = gsel.enter();
    let group_enter = gsel_enter.append("g")
        .attr("class", "asteroidgroup")
    ;
    group_enter.append("circle")
        .attr("r", 0.8)
        .attr("cx", d => velocityScale(d.velocity))
        .attr("cy", d => distanceScale(d.distance))
        .attr("class", "asteroid-inner")
    ;
    group_enter.append("circle")
        .attr("cx", d => velocityScale(d.velocity))
        .attr("cy", d => distanceScale(d.distance))
        .attr("class", "asteroid-outer")
        .transition().ease(easing).duration(duration)
        .attr("r", d => diameterScale(d.diameter))
    ;

    gsel.select(".asteroid-inner")
        .transition().ease(easing).duration(duration)
        .attr("cx", d => velocityScale(d.velocity))
        .attr("cy", d => distanceScale(d.distance))
    ;

    gsel.select(".asteroid-outer")
        .transition().ease(easing).duration(duration)
        .attr("r", d => diameterScale(d.diameter))
        .attr("cx", d => velocityScale(d.velocity))
        .attr("cy", d => distanceScale(d.distance))
    ;
}

function load_daily_legend(sel) {
    
    let gsel = sel.selectAll(".daygroup")
        .data(weekly)
        .enter();

    let group = gsel.append("g")
        .attr("class", "daygroup")
        .attr("id", d => d.dayname)
        .on('click', function(event, d) {
            selected_day = d.index;
            update_daily_legend();
            update_daily(d3.select("#day_vis", weekly));
        });

    group.append("circle")
        .attr("r", 22)
        .attr("cx", (d, i) => 30 +(50 * i))
        .attr("cy", 120)
    ;

    group.append("text")
        .attr("x", (d, i) => 30+(50 * i))
        .attr("y", 122)
        .attr("dominant-baseline","middle")
        .attr("text-anchor","middle")
        .text(d => d.dayname)
    ;

    // STATIC LEGENDS
    // (warning: these should be properly grouped!)

    sel.append("text")
        .attr("x", 10)
        .attr("y", 85)
        .attr("class","legend-text")
        .text("Select one day to update the chart:");

    sel.append("text")
        .attr("x", "91%")
        .attr("y", "53.5%")
        .attr("class","legend-text")
        .text("1km");
    sel.append("text")
        .attr("x", "76%")
        .attr("y", "53.5%")
        .attr("class","legend-text")
        .text("0.1m");
    sel.append("text")
        .attr("x", "74.5%")
        .attr("y", "30%")
        .attr("class","legend-text")
        .text("DIAMETER");

    sel.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("class","legend-title")
        .text("Asteroids of the week");

    sel.append("circle")
        .attr("r", 0.8)
        .attr("cx", "90%")
        .attr("cy", "50%")
        .attr("class", "asteroid-inner")
    ;
    sel.append("circle")
        .attr("cx", "90%")
        .attr("cy", "50%")
        .attr("class", "asteroid-outer")
        .attr("r", day_max_diameter)
    ;
    sel.append("circle")
        .attr("r", 0.8)
        .attr("cx", "75%")
        .attr("cy", "50%")
        .attr("class", "asteroid-inner")
    ;
    sel.append("circle")
        .attr("cx", "75%")
        .attr("cy", "50%")
        .attr("class", "asteroid-outer")
        .attr("r", day_min_diameter)
    ;




    update_daily_legend();
}

function update_daily_legend() {
    let updategsel = d3.selectAll(".daygroup");
    updategsel.selectAll("circle")
        .attr("class", (d, i) => (d.index === selected_day)? "daymarker-selected" : "daymarker");

    updategsel.selectAll("text")
        .attr("class", (d, i) => (d.index === selected_day)? "daymarker-text-selected" : "daymarker-text");
}

function load_vis(neob) {
    feed_preparation(neob);
    //console.log(daily);

    // create root svg
    let sel = d3.select("#vis");

    let svg = sel.append("svg")
        .attr("viewBox", "0 0 "+total_w+" "+total_h)
        .attr("id","neovis");
    let defs = svg.append("defs");

    let rad = defs.append("radialGradient")
        .attr("id","rad");
    rad.append("stop")
        .attr("offset",0.8)
        .attr("stop-color","white")
        .attr("stop-opacity",0);
    rad.append("stop")
        .attr("offset",1)
        .attr("stop-color","white")
        .attr("stop-opacity",1);

    let mask = defs.append("mask")
        .attr("id","mask")
        .attr("maskUnits","objectBoundingBox")
        .attr("maskContentUnits","objectBoundingBox");
    mask.append("circle")
        .attr("cx",0.5)
        .attr("cy",0.5)
        .attr("r",0.5)
        .attr("fill","url(#rad)");

    let background = defs.append("linearGradient")
        .attr("id","background")
        .attr("gradientTransform","rotate(90)");
    background.append("stop")
        .attr("offset",0.08)
        .attr("id","bg-top");
    background.append("stop")
        .attr("offset",0.92)
        .attr("id","bg-bottom");


    svg.append("rect")
        .attr("width","100%")
        .attr("height","100%")
        .attr("fill","url(#background)");

    // create the svg with the daily view legend
    let svg_day_leg = svg.append("svg")
        .attr("x",day_leg_x)
        .attr("y",day_leg_y)
        .attr("width",day_w)
        .attr("height",leg_h)
        .attr("viewBox", ""+0+" "+0+" "+day_w+" "+leg_h)
        .attr("overflow","visible")
        .attr("id","day_leg");
    //svg_day_leg.append("rect").attr("width","100%").attr("height","100%").attr("class","debug");
    load_daily_legend(svg_day_leg, weekly);

    // create the svg with the magnitude view legend
    let svg_mag_leg = svg.append("svg")
        .attr("x",mag_leg_x)
        .attr("y",mag_leg_y)
        .attr("width",mag_w)
        .attr("height",leg_h)
        .attr("viewBox", ""+0+" "+0+" "+mag_w+" "+leg_h)
        .attr("overflow","visible")
        .attr("id","mag_leg");
    svg_mag_leg.append("rect").attr("width","100%").attr("height","100%").attr("class","debug");

    // create the svg with the daily view visualization
    let svg_day_vis = svg.append("svg")
        .attr("x",day_vis_x)
        .attr("y",day_vis_y)
        .attr("width",day_w)
        .attr("height",vis_h)
        .attr("viewBox", ""+0+" "+0+" "+day_w+" "+vis_h)
        .attr("overflow","visible")
        .attr("id","day_vis");
    //svg_day_vis.append("rect").attr("width","100%").attr("height","100%").attr("class","debug");
    load_daily(svg_day_vis);
    update_daily(svg_day_vis, weekly);

    // create the svg with the magnitude view visualization
    let svg_mag_vis = svg.append("svg")
        .attr("x",mag_vis_x)
        .attr("y",mag_vis_y)
        .attr("width",mag_w)
        .attr("height",vis_h)
        .attr("viewBox", ""+0+" "+0+" "+mag_w+" "+vis_h)
        .attr("overflow","visible")
        .attr("id","mag_vis");
    svg_mag_vis.append("rect").attr("width","100%").attr("height","100%").attr("class","debug");

}
