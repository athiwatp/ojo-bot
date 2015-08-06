var util 		= require('util'),
	fs			= require('fs'),
	async	 	= require('async'),
	path		= require('path'),
	moment		= require('moment'),
	_			= require('underscore'),
	Hawk		= require('hawk'),
	filesize 	= require('filesize'),
	Query		= require('./query_s3')
	;
	
	var	bbox		=	[60, 40, 80, 20];				// lng,lat bottom left - top right
	var	centerlon	=  	(bbox[0]+bbox[2])/2;
	var	centerlat	=	(bbox[1]+bbox[3])/2;
	
	var source_url = "http://pmm.nasa.gov/"
	
	var options = {
		bucket: 		'ojo-global',
		subfolder: 		'gpm',
		browse_img: 	"_thn.jpg",
		geojson: 		undefined,
		topojson: 		".topojson",
		topojson_gz: 	".topojson.gz",
		tif: 			".tif",
		source: 		'sources.gpm',
		sensor: 		'sensors.gpm',
		resolution: 	'400m',
		original_url:   source_url,
		product: 		'precipitation',
		tags: 			['precip_1d', 'precip_3d', 'precip_7d', 'precipitation', 'rainfall'],
		bbox: 			bbox,							// lng,lat bottom left - top right
		target: 		[centerlon, centerlat],
		minzoom: 		6,
		prefix_map: 	{
			'precip_1d': 'gpm_1d',
			'precip_3d': 'gpm_3d',
			'precip_7d': 'gpm_7d'
		}
	}
	
	//var colors    = [ "#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#0868ac","#084081","#810F7C","#4D004A"	]
	var colors  	= [ "#56F6FC","#58DEEE","#5BC6DE","#5EAFCC","#5E99B8","#5D84A3","#596F8D","#535B77","#4A4861","#3F374B","#322737","#241824"]

	options.credits	= function(req) {
		var json = {
			"credits":  req.gettext("legend.precipitation.credits"),
			"url": 		source_url
		};
		return json;
	}
	options.style = function(req) {
		var json = {
			"{precip}==2": {
				color: colors[0], 	
				weight: 2
			},
			"{precip}==3": {
				color: colors[1], 	
				weight: 2
			},
			"{precip}==5": {
				color: colors[2], 	
				weight: 2
			},
			"{precip}==8": {
				color: colors[3], 	
				weight: 2
			},
			"{precip}==13": {
				color: colors[4], 	
				weight: 2
			},
			"{precip}==21": {
				color: colors[5], 	
				weight: 2
			},
			"{precip}==34": {
				color: colors[6], 	
				weight: 2
			},
			"{precip}==55": {
				color: colors[7], 	
				weight: 2
			},
			"{precip}==89": {
				color: colors[8], 	
				weight: 2
			},
			"{precip}==144": {
				color: colors[9], 	
				weight: 2
			},
			"{precip}==233": {
				color: colors[10], 	
				weight: 2
			},
			"{precip}==377": {
				color: colors[11], 	
				weight: 2
			}
		}
		return json
	}

	options.legend = function(req) {
		var html = "<style id='precipitation_legend_style' >"
	    html += ".precipitation_map-info .legend-scale ul {"
	    html += "   margin: 0;"
	    html += "   margin-bottom: 5px;"
	    html += "   padding: 0;"
	    html += "   float: right;"
	    html += "   list-style: none;"
	    html += "   }"
		html += ".precipitation_map-info .legend-scale ul li {"
		html += "   font-size: 80%;"
		html += "   list-style: none;"
		html += "    margin-left: 0;"
		html += "    line-height: 18px;"
		html += "    margin-bottom: 2px;"
		html += "}"
	    html += ".precipitation_map-info ul.legend-labels li span {"
	    html += "  display: block;"
	    html += "  float: left;"
	    html += "  height: 16px;"
	    html += "  width: 30px;"
	    html += "  margin-right: 5px;"
	    html += "  margin-left: 0;"
	    html += "  border: 1px solid #999;"
	    html += "}"
	    html += ".precipitation_map-info .legend-source {"
	    html += "   font-size: 70%;"
	    html += "   color: #999;"
	    html += "   clear: both;"
	    html += "}"
		html += ".precipitation_map-info {"
		html += "    padding: 6px 8px;"
		html += "    font: 14px/16px Arial, Helvetica, sans-serif;"
		html += "    background: white;"
		html += "    background: rgba(255,255,255,0.8);"
		html += "    box-shadow: 0 0 15px rgba(0,0,0,0.2);"
		html += "    border-radius: 5px;"
		html += "	 position: relative;"
		html += "	 float: right;"
		html += "    line-height: 18px;"
		html += "    color: #555;"
	
		html += "}"
		html += "</style>"
	
		html += "<div id='precipitation_legend' class='precipitation_map-info'>"
		html += "  <div class='legend-title'>"+ req.gettext("legend.precipitation.title")+"</div>"
		html += "  <div class='legend-scale'>"
		html += "    <ul class='legend-labels'>"
		html += "	   <li><span style='background: " + colors[0] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.2mm") +"</li>"
		html += "	   <li><span style='background: " + colors[1] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.3mm") +"</li>"
		html += "	   <li><span style='background: " + colors[2] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.5mm") +"</li>"
		html += "	   <li><span style='background: " + colors[3] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.8mm") +"</li>"
		html += "	   <li><span style='background: " + colors[4] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.13mm") +"</li>"
		html += "	   <li><span style='background: " + colors[5] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.21mm") +"</li>"
		html += "	   <li><span style='background: " + colors[6] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.34mm") +"</li>"
		html += "	   <li><span style='background: " + colors[7] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.55mm") +"</li>"
		html += "	   <li><span style='background: " + colors[8] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.89mm") +"</li>"
		html += "	   <li><span style='background: " + colors[9] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.144mm") +"</li>"
		html += "	   <li><span style='background: " + colors[10] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.233mm") +"</li>"
		html += "	   <li><span style='background: " + colors[11] + "'></span>&nbsp;"+ req.gettext("legend.precipitation.legend.377mm") +"</li>"
		html += "    </ul>"
		html += "  </div>"
		html += "<div class='legend-source'>"+ req.gettext("legend.precipitation.source.label")+": <a href='"+source_url+"'>"+ req.gettext("legend.precipitation.source.source")+"</a>"
		html += "</div>&nbsp;&nbsp;"
	
		console.log("legend title", req.gettext("legend.precipitation.title"))
	
		return html
	}
	
	function FindRegionKey(lat, lon) {
		console.log("Global Region")
		var r = 'Global'
		return r
	}
	
	var query					= new Query(options)
    query.source				= "gpm"
    query.FindRegionKey			= FindRegionKey
	module.exports.query		= query;