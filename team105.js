window.onload=function(){

var width=1600;
var height=800;

var margin = {top: 0, right: 50, bottom: 50, left: 150}
//w = window.innerWidth - margin.left - margin.right // Use the window's width 
//h = window.innerHeight - margin.top - margin.bottom; // Use the window's height
w=width-margin.left-margin.right;
h=height-margin.top-margin.bottom;


var dataset=[];
d3.dsv(",", "data.csv", function(d) {//Note that the .csv needs to be ordered by species then by week (ascending)
    
    if(d['dist']==undefined){
        dataset.push({
            x:parseFloat(d['long_mean']),
            y:parseFloat(d['lat_mean']),
            species:d['Species'],
            speciescode:d['Species_code'],
            c1:d['cluster2'],
            c2:d['cluster3'],
            c3:d['cluster4'],
            hc2:d['hcluster2'],
            hc3:d['hcluster3'],
            hc4:d['hcluster4']
        });
    }else{
        dataset.push({
            x:parseFloat(d['long_mean']),
            y:parseFloat(d['lat_mean']),
            species:d['Species'],
            speciescode:d['Species_code'],
            dist:parseFloat(d['dist']),
            c2:d['cluster2'],
            c3:d['cluster3'],
            c4:d['cluster4'],
            hc2:d['hcluster2'],
            hc3:d['hcluster3'],
            hc4:d['hcluster4']
        });
    }

  return {
    //source: d.source,
    //target: d.target,
    //value: +d.value
  }
}).then(function(data) {

//Could do species, week(ascending) ordering here
//console.log(dataset);


//Get the object keys
pathKeys=[];
for(i=1;i<dataset.length;i++){
    if(pathKeys.includes(dataset[i]['speciescode'])==0){
        pathKeys.push(dataset[i]['speciescode']);
    }
}

var numPaths=pathKeys.length;
var numPoints=dataset.length/numPaths;

//Create a series for making the paths
var seriesPath=[];
for(i=0;i<numPaths;i++){
    var tempSeries=[];
    for(j=0;j<numPoints;j++){
        tempSeries.push({x:dataset[(i*numPoints)+j]['x'],y:dataset[(i*numPoints)+j]['y'],speciescode:dataset[(i*numPoints)+j]['speciescode']});
    }
    seriesPath.push(tempSeries);
}
//console.log('seriesPath');
//console.log(seriesPath);

//document.getElementById('log').innerHTML='Creating series for points';
//Create a series for making the points
var seriesPoints=[];
for(i=0;i<dataset.length;i++){
    seriesPoints.push({x:dataset[i]['x'],y:dataset[i]['y'],speciescode:dataset[i]['speciescode']});
}
//console.log('seriesPoints');
//console.log(seriesPoints);


//Create SVG
var svg=d3.select('#visualization').append('svg')
	.attr('width',w+margin.left+margin.right)
    .attr('height',h+margin.top+margin.bottom)
    //.append('g')
    .attr('transform','translate('+margin.left+','+margin.top+')');
    //.attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox", "0 0 1500 900")
    //.classed("svg-content-responsive", true).attr("width", "100%").attr("height", "100%");
    //.attr("viewBox", "50 0 600 600")
    //.classed("svg-content-responsive", true).attr("width", "100%").attr("height", "100%");

latMin=-90;
latMax=90;
longMin=-180;
longMax=180;

geo=svg.append('g')
    .attr('id','geo')
    .attr('transform','translate(20,10)');

content=svg.append('g')
    .attr('id','content')
    .attr('transform','translate(20,10)');


const projection = d3.geoEquirectangular()
    .scale(240)
    //.translate([692.6749999999998, 347.0914981877568])
    .translate([740, 370]);
const geopath = d3.geoPath().projection(projection);

var promise1 = d3.json("custom.geo.json");
Promise.all([promise1])
    .then(d => ready(null, d[0], d[1]));

function ready(error, world) {

geo.append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(world.features)
    .enter().append("path")
    .attr("d", geopath)
    .style("fill", "lightgray")
    .style("stroke", "black")
    .style("stroke-width", 0.3);

}



var zoom = d3.zoom()
    .scaleExtent([1, 20])
    .extent([[0, 0], [w, h]])
    .translateExtent([[0, 0], [w, h]])
    .on("zoom", zoomed);

var xScale=d3.scaleLinear()
    .domain([longMin,longMax])
    .range([0, w]);
var yScale=d3.scaleLinear()
    .domain([latMin,latMax])
    .range([h,0]);

var xAxis=d3.axisBottom(xScale)
    .ticks((longMax-longMin)/9);
var yAxis=d3.axisLeft(yScale)
    .ticks((latMax-latMin)/9);


gX=svg.append('g')
	.attr('class','xaxis')
	.attr('transform','translate(20,'+(h+10)+')')
    .call(xAxis);
gY=svg.append('g')
    .attr('class','yaxis')
    .attr('transform','translate(20,10)')
    .call(yAxis);    

svg.call(zoom);
d3.select("svg").on("dblclick.zoom", null);

function zoomed() {
    content.attr('transform', d3.event.transform);
    geo.attr('transform', d3.event.transform);
    //console.log(d3.event.transform);
    //var scale=document.getElementById('content').transform['animVal'][1]['matrix']['a'];
    //Try to rescale points and circles
    gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
    gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
}



var line=d3.line()
    .x(function(d){return xScale(d.x)})
    .y(function(d){return yScale(d.y)})
    .curve(d3.curveCatmullRomClosed);
//Create paths
var svgPaths=content.selectAll(".line")
    .data(seriesPath)
    .enter().append("path")
    .attr("class","pathHidden")
    .attr("id",function(d,i){return "path"+d[0].speciescode})
    .attr("d",line);
//Create points
var svgPoints=content.selectAll("circle")
    .data(seriesPoints)
    .enter().append("circle")
    .attr("class",function(d){return 'pointHidden point'+d.speciescode})
    .attr("transform", function(d) {return "translate("+xScale(d.x)+","+yScale(d.y)+")"; });




//Function to get the length of a point on a path
function getLengthForPoint(p,path){
    var pathLength=path.getTotalLength();
    var theRecord=pathLength
    var precision=1000;//Change this to a higher number if the path distance calculation makes the circles move in reverse
        //highest value precision has needed to be set at was around 50000, but this takes a lot of time to compute
    var division=pathLength/precision;
    var theSegment;
    for (var i=0;i<precision;i++) {
        // get a point on the path for this distance, note that the path is scaled, so p1 does not need to be scaled
        var p1 = path.getPointAtLength(i*division);
        // get the distance between the new point p1 and the point p
        var theDistance=dist(p1,p);
        if (theDistance<theRecord) {
            // if the distance is smaller than the record set the new record
            theRecord=theDistance; 
            theSegment=i;
        }
        
    }
    return(theSegment*division);
  }

// a helper function to measure the distance between 2 points
function dist(p1,p2) {
    var dx=xScale(p2.x)-p1.x;//Note that the path is scaled, so p1 does not need to be scaled
    var dy=yScale(p2.y)-p1.y;
    return Math.sqrt(dx*dx+dy*dy);
}

if(dataset[0]['dist']==undefined){//If distances were not pre-processed, then process them
    //Fill in distances on the main dataset
    for(i=0;i<numPaths;i++){
        pathID=pathKeys[i];
        for(j=0;j<numPoints;j++){
            //document.getElementById('log').innerHTML='Appending path distances for '.concat(i*numPoints+j);
            dataset[i*numPoints+j]['dist']=getLengthForPoint(dataset[i*numPoints+j],document.getElementById('path'+pathID));
        }
    }
}
//console.log("dataset");
//console.log(dataset);




/*
/////////////////////////////////////////////////////////////////////
//Adding a way to save the distances so that loading can skip the above step, should not be in the final release
// Building the CSV from the Data two-dimensional array
// Each column is separated by ";" and new line "\n" for next row
var csvRows = [];

for(var i=0, l=dataset.length; i<l; ++i){
    csvRows.push(''.concat(dataset[i]['dist']).concat(',\n'));
}

var csvString = csvRows.join('');//.join("%0A");
var a         = document.createElement('a');
a.href        = 'data:attachment/csv,' +  encodeURIComponent(csvString);
a.target      = '_blank';
a.download    = 'myFile.csv';

document.body.appendChild(a);
a.click();
/////////////////////////////////////////////////////////////////////////////
*/






//Create a series for making the circles that move
//This also has additional information relating to the transition by step number
var seriesCircles=[];
for(i=0;i<numPaths;i++){
    tempTransition={};
    tempPathID=pathKeys[i];
    for(j=0;j<numPoints;j++){
        if(j==numPoints-1){//Determine the next step
            next=0;
        }else{
            next=j+1;
        }

        tempTransition[j+1]={};//Create a dictionary to hold a transition details (start and distance)
        tempTransition[j+1]['start']=dataset[i*numPoints+j]['dist'];
        if(dataset[i*numPoints+next]['dist']==0){
            pathDistance=document.getElementById('path'+tempPathID).getTotalLength()-dataset[i*numPoints+j]['dist'];
        }else{
            pathDistance=dataset[i*numPoints+next]['dist']-dataset[i*numPoints+j]['dist'];
        }
        tempTransition[j+1]['distance']=pathDistance;
    }

    seriesCircles.push({
        x:dataset[i*numPoints]['x'],
        y:dataset[i*numPoints]['y'],
        species:dataset[i*numPoints]['species'],
        speciescode:dataset[i*numPoints]['speciescode'],
        transition:tempTransition,
        c2:dataset[i*numPoints]['c2'],
        c3:dataset[i*numPoints]['c3'],
        c4:dataset[i*numPoints]['c4'],
        hc2:dataset[i*numPoints]['hc2'],
        hc3:dataset[i*numPoints]['hc3'],
        hc4:dataset[i*numPoints]['hc4']
    });
}
//console.log('seriesCircles');
//console.log(seriesCircles);

//Circle parmeters
var circleRadius=3;
var circleStrokeWidth=0.5;

//Tooltip parameters
//Background parameters
var tooltipHeight=16;
//Text parameters
var tooltipFont="sans-serif";
var tooltipFontSize=12;
var tooltipFontWeight="bold";
var tooltipTextOffsetX=5;
var tooltipTextOffsetY=-(tooltipHeight-tooltipFontSize);
//Shared parameters
var tooltipOffsetX=6;
var tooltipOffsetY=-5;


//Helper function to select/unselect species
function toggleSpeciesSelect(speciescode){
    path=document.getElementById('path'+speciescode);
    point=document.getElementsByClassName('point'+speciescode);

    if(path.className['baseVal']=='pathHidden'){
        path.classList.add('pathVisible');
        path.classList.remove('pathHidden');
        for(var i=0;i<point.length;i++){
            point[i].classList.add('pointVisible');
            point[i].classList.remove('pointHidden');
        }
        document.getElementById('tooltipcontainer'+speciescode).style.visibility="visible";
        document.getElementById('circle'+speciescode).style.stroke="black";
        document.getElementById('checkbox'+speciescode).checked=true;
    }else{
        path.classList.add('pathHidden');
        path.classList.remove('pathVisible');
        for(var i=0;i<point.length;i++){
            point[i].classList.add('pointHidden');
            point[i].classList.remove('pointVisible');
        }
        document.getElementById('tooltipcontainer'+speciescode).style.visibility="hidden";
        document.getElementById("circle"+speciescode).style.stroke="white";
        document.getElementById('checkbox'+speciescode).checked=false;
    }
}

//Circles
var svgCircles=content.selectAll(".circle")
    .data(seriesCircles)
    .enter().append("circle")
    .attr("class","circle")
    .attr("id",function(d,i){return "circle"+d.speciescode})
    .attr("transform", function(d){return "translate(" + xScale(d.x) +","+yScale(d.y)+ ")"})
    .attr("r",circleRadius)
    .attr("stroke-width",circleStrokeWidth)
    .attr("stroke","white")
    .on('click',function(d){
        toggleSpeciesSelect(d.speciescode);
    })
    .on('mouseover',function(d){
        document.getElementById('tooltipcontainer'+d.speciescode).style.visibility="visible";
    })
    .on('mouseout',function(d){
        path=document.getElementById('path'+d.speciescode);
        if(path.className['baseVal']!='pathVisible'){//Only remove tooltips on mouseout if the path is not visible (user selection)
            document.getElementById('tooltipcontainer'+d.speciescode).style.visibility="hidden";
        }
    });




//Function to get the text width in pixels, used below in the tooltip to create the background width
function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

//Tooltip
var tooltip=content.selectAll(".groups")
    .data(seriesCircles)
    .enter().append("g")
    .attr("class","tooltipcontainer")
    //.style("opacity",0)
    .style("visibility","hidden")
    .attr("id",function(d){return "tooltipcontainer"+d.speciescode});

tooltip.append("rect")//tooltip background
    .attr("transform", function(d){
        return "translate(" + tooltipOffsetX +","+(-tooltipHeight+tooltipOffsetY)+ ")"})
    .attr("fill","rgba(0, 0, 0, 0.7)")
    .attr("rx",4)
    .attr("width",function(d){
        return getTextWidth(d.species,tooltipFontWeight+" "+tooltipFontSize+"pt "+tooltipFont)*0.8+4})
    .attr("height",tooltipHeight);

tooltip.append("rect")//tooltip bottom left pointer
    .attr("id",function(d){return "tooltipbackgroundpointer"+d.speciescode})
    .attr("transform", function(d){
        return "translate("+(0.7071*circleRadius)+","+(-0.7071*circleRadius)+") rotate(-45)"})
    .attr("fill","rgba(0, 0, 0, 0.7)")
    .attr("width",circleRadius-circleStrokeWidth+4)
    .attr("height",1);

tooltip.append("text")//tooltip text
    .attr("id",function(d){return "tooltiptext"+d.speciescode})
    .attr("class","tick")//Similar to the axis class, do not allow this text to be selectable
    .attr("transform", function(d){
        return "translate(" + (tooltipTextOffsetX+tooltipOffsetX) +","+(tooltipTextOffsetY+tooltipOffsetY)+ ")"})
    .text(function(d){return d.species})
    .attr("font-family",tooltipFont)
    .attr("font-size",tooltipFontSize+"px")
    .attr("font-weight",tooltipFontWeight)
    .style("top","10px")
    .attr("fill","white");


//Animate the circles and tooltips
var step=1;
var stepMax=numPoints;
var animate=true;
var animateDuration=500;
var dictDates={
    1:'Jan 01',2:'Jan 08',3:'Jan 15',4:'Jan 22',5:'Jan 29',6:'Feb 05',7:'Feb 12',8:'Feb 19',9:'Feb 26',10:'Mar 05',
    11:'Mar 12',12:'Mar 19',13:'Mar 26',14:'Apr 02',15:'Apr 09',16:'Apr 16',17:'Apr 23',18:'Apr 30',19:'May 07',20:'May 14',
    21:'May 21',22:'May 28',23:'Jun 04',24:'Jun 11',25:'Jun 18',26:'Jun 25',27:'Jul 02',28:'Jul 09',29:'Jul 16',30:'Jul 23',
    31:'Jul 30',32:'Aug 06',33:'Aug 13',34:'Aug 20',35:'Aug 27',36:'Sep 03',37:'Sep 10',38:'Sep 17',39:'Sep 24',40:'Oct 01',
    41:'Oct 08',42:'Oct 15',43:'Oct 22',44:'Oct 29',45:'Nov 05',46:'Nov 12',47:'Nov 19',48:'Nov 26',49:'Dec 03',50:'Dec 10',
    51:'Dec 17',52:'Dec 24'
}
transition();
function transition() {
    if(animate==true){
        document.getElementById('week').innerHTML='Week '+step+' ('+dictDates[step]+')';
        
        d3.selectAll('.tooltipcontainer')
            .each(function(d){
                d3.select(this)//Get each tooltip, note that the data is based on the seriesCircles variable
                    .transition().duration(animateDuration)
                    .ease(d3.easeLinear)
                    .attrTween("transform", 
                        translateAlongPathStep(
                            document.getElementById('path'+d.speciescode),
                            d['transition'][step]['start'],
                            d['transition'][step]['distance']
                        )
                    )
            });

        d3.selectAll('.circle')
            .each(function(d){
                d3.select(this)//Get each circle, note that the data is based on the seriesCircles variable
                    .transition().duration(animateDuration)
                    .ease(d3.easeLinear)
                    .attrTween("transform", 
                        translateAlongPathStep(
                            document.getElementById('path'+d.speciescode),
                            d['transition'][step]['start'],
                            d['transition'][step]['distance'],
                            "circle"
                        )
                    )
                    .on('end',function(d){if(this.id=='circle'+pathKeys[0]){transition()}});//Needs this if statement otherwise it will trigger for each circle
            });

        if(step==stepMax){//Somewhat makes this function into a for loop
            step=1;
        }else{
            step+=1;
        }
    }
}

// Returns an attrTween for translating along the specified path element.
function translateAlongPathStep(path,pathStart,pathDistance) {
    return function(d, i, a) {
        return function(t) {
            var p = path.getPointAtLength(t*(pathDistance)+pathStart);
                return "translate("+p.x+","+p.y+")";
        }
    }
}





//Species selection
for(i=0;i<seriesCircles.length;i++){
    var idPrefix='checkbox';
    var elemcontainer=document.createElement('div');

    var elem=document.createElement('input');
    elem.setAttribute('type','checkbox');
    elem.setAttribute('id',idPrefix.concat(seriesCircles[i]['speciescode']));
    elem.onclick=function(){toggleSpeciesSelect(this.id.substr(idPrefix.length,this.id.length-(idPrefix.length)))};
    elem.style.display='inline-block';
    elemcontainer.appendChild(elem);

    var elem=document.createElement('div');
    elem.style.display='inline-block';
    elem.style.fontFamily='arial';
    elem.style.fontSize='14px';
    elem.innerHTML=seriesCircles[i]['species'];
    elemcontainer.appendChild(elem);

    document.getElementById('selectionspecies').appendChild(elemcontainer);
}

//Color selection
listOptions=['Default','2 Clusters','3 Clusters','4 Clusters','2 Clusters (Hierarchical)','3 Clusters (Hierarchical)','4 Clusters (Hierarchical)'];
listOptionsCluster=['d','c2','c3','c4','hc2','hc3','hc4'];
colorSchemeTableau10=['#4682b4','#4e79a7','#f28e2c','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab'];//#4268b4 is default

function changeCircleColor(cluster){
    console.log(cluster=='d');
    if(cluster=='d'){
        d3.selectAll('.circle')
            .each(function(d){
                d3.select(this)//Get each tooltip, note that the data is based on the seriesCircles variable
                    .style('fill',colorSchemeTableau10[0]); 
            });
    }else{
    d3.selectAll('.circle')
        .each(function(d){
            d3.select(this)//Get each tooltip, note that the data is based on the seriesCircles variable
                .style('fill',colorSchemeTableau10[parseInt(d[cluster])+1]); 
        });
    }
}

for(var i=0;i<listOptions.length;i++){
    try{throw i}
    catch(ii){//catch block of try/catch has its own scope
        var elemcontainer=document.createElement('div');

        var elem=document.createElement('input');
        elem.setAttribute('type','radio');
        elem.setAttribute('id','radio'+ii);
        elem.setAttribute('onclick','changeCircleColor('+listOptionsCluster[ii]+')');//for FF
        elem.onclick=function() {changeCircleColor(listOptionsCluster[ii])};//for IE
        elem.checked=true;
        elem.name='radiocolor';
        elem.style.display='inline-block';
        elemcontainer.appendChild(elem);

        var elem=document.createElement('div');
        elem.style.display='inline-block';
        elem.style.fontFamily='arial';
        elem.style.fontSize='14px';
        elem.innerHTML=listOptions[ii];
        elemcontainer.appendChild(elem);

        document.getElementById('colorby').appendChild(elemcontainer);
    }
}

//Default colors
// Get all radios, then simply emulate a click on the first one
radioDefault=document.getElementById('radio0');
radioDefault.checked=true;

d3.selectAll('.circle')
    .each(function(d){
        d3.select(this)//Get each tooltip, note that the data is based on the seriesCircles variable
            .style('fill',colorSchemeTableau10[0]); 
    });


//Play pause button
elem=document.getElementById('playpause');
elem.onclick=function(){
    if(elem.className=='pause'){
        elem.className='play';
        animate=false;
    }else{
        elem.className='pause';
        animate=true;
        transition();
    }
}


}).catch(function(error) {
  console.log(error);
});

}
