#!/usr/bin/env node

const fs = require('fs-extra')
const process = require('process')
const opts = require('commander')

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const {document} = (new JSDOM('<!doctype html><html><body></body></html>')).window;
global.document = document;
global.window = document.defaultView;

jquery = require("jquery"); 

if (require.main === module) {

    opts.option('-d, --dataset [value]', 'Dataset name: micro, small, medium, large')
    .option('-o, --output_format [value]', 'Output format: simple (default), meta')
    .parse(process.argv)

    if (!opts.dataset) {
        console.error('require dataset name')
        opts.help()
    }

    const req_body = fs.readJsonSync(`req.${opts.dataset}.json`, {encoding: 'utf8'})
    const genomes_set = req_body.params[0].genomeFilterStatus;

    //curl -X POST -H 'Content-Type:application/solrquery+x-www-form-urlencoded' -H 'Accept:application/json' 'https://p3.theseed.org/services/data_api/genome/' -d 'q=genome_id:("1170703.3" OR "1171378.5")&fl=genome_id,genome_name,host_name,isolation_country' > metadata.json
    const request_genome_ids = req_body.params[0].genomeIds;
    const request_data = "q=genome_id:(\"" + request_genome_ids.join("\" OR \"") + "\")&fl=genome_id,genome_name,host_name,isolation_country"
    // console.log(request_data)
    // console.log('---------------------------------------')
    // console.log('---------------------------------------')
    
    jquery.ajax({
        type: "POST",
        accept: "application/json",
        url: "https://p3.theseed.org/services/data_api/genome/",
        contentType: "application/solrquery+x-www-form-urlencoded",
        data: request_data, 
        success: success
    })

    function csvJSON(csv){
      var lines=csv.split("\n");
      var result = [];
      var headers=lines[0].split(",");

      for(var i=1;i<lines.length - 1;i++){
          var obj = {};
          var currentline=lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          currentline = currentline || [];
          console.log(currentline)
          for(var j=0;j<headers.length;j++){
            
            if (currentline[j]) {
                currentline[j] = currentline[j].replace(/['"]+/g, '')
            }
            obj[headers[j]] = currentline[j];
          }
          result.push(obj);
      }
      return (result);
    }

    function success(response) {
        var jsonData = csvJSON(response);       
        runConverter(opts.dataset, opts.output_format || 'simple', jsonData)
    }

    // runConverter(opts.dataset, opts.output_format || 'simple')
}

function runConverter(dataset, output_format, genomes_metadata) {

    //dataset = micro, large, etc. 

    console.log(`dataset: ${dataset}, output: ${output_format}`)
    console.log(genomes_metadata)

    // make sure files are exit
    try {
        const has_reqeust_json = fs.statSync(`req.${dataset}.json`)
        const has_response_json = fs.statSync(`${dataset}.json`)
    } catch (ex) {
        console.log(ex.message)
    }
    const req_body = fs.readJsonSync(`req.${dataset}.json`, {encoding: 'utf8'})
    const genomes_set = req_body.params[0].genomeFilterStatus;

    const genomes = Object.keys(genomes_set)
    const total_genomes = genomes.length

    var clustergrammerdata = {};
    clustergrammerdata.row_nodes = [];
    clustergrammerdata.col_nodes = [];
    clustergrammerdata.mat = [];

    const res_body = fs.readJsonSync(`${dataset}.json`, {encoding: 'utf8'})
    const families = res_body.result;

    // https://media.readthedocs.org/pdf/clustergrammer/stable/clustergrammer.pdf
    // row_nodes and col_nodes objects are required to have three properties: name, clust, rank. 

    // "name": "ATF7",
    // "clust": 67,
    // "rank": 66,

    for (let i = 0, len = families.length; i < len; i++) {
        const family = families[i];
        var row_node = {};
        
        row_node.name = "FAMILY: " + family.family_id;
        //row_node.ini = families.length - i;
        row_node.clust = families.length - i + 1;
        row_node.rank = i + 1;
        //todo - determine rankvar better
        //row_node.rankvar = i + 1;
        row_node["cat-0"] = "FAMILY NAME: " + family.description;
        //todo - determine cat-o index better
        //row_node["cat_0_index"] = i;

        clustergrammerdata.row_nodes.push(row_node);
    }

    const numberGenomes = Object.keys(genomes_set).length;

    for (var genome in genomes_set) {

        var col_node = {};

        var that = this;
        var index = genomes_set[genome].index;

        for (var i = 0; i < genomes_metadata.length; i++) {

            var genome_data = genomes_metadata[i];
                        
            if (genome_data.genome_id === genome) {
                that.genome_metadata = genome_data;
                break;
            }
        }


        col_node.name = "Genome: " + genome;
        //col_node.ini = numberGenomes - index;
        col_node.clust = numberGenomes - index;

        //TODO - improve rank
        col_node.rank = index + 1;

        col_node["cat-0"] = "Name: " + genomes_set[genome].label;

        if (that.genome_metadata.hasOwnProperty('isolation_country')) {
            col_node["cat-1"] = "Isolation Country: " + that.genome_metadata.isolation_country;
        } else {
            col_node["cat-1"] = "Isolation Country: n/a"
        }

        if (that.genome_metadata.hasOwnProperty('host_name')) {
            col_node["cat-2"] = "Host Name: " + that.genome_metadata.host_name;
        } else {
            col_node["cat-2"] = "Host Name: n/a"
        }

        if (that.genome_metadata.hasOwnProperty('genome_group')) {
            col_node["cat-3"] = "Genome Group: " + that.genome_metadata.genome_group;
        } else {
             col_node["cat-3"] = "Genome Group: n/a"
        }

        //col_node["cat_0_index"] = index;

        clustergrammerdata.col_nodes.push(col_node);
    }

    // for (var genome in genomes_set) {

    //     var col_node = {};

    //     var that = this;
    //     var index = genomes_set[genome].index;

    //     const genome_metadata = genomes_metadata[genome];
    //     console.log(genome_metadata)

    //     col_node.name = "Genome: " + genome;
    //     //col_node.ini = numberGenomes - index;
    //     col_node.clust = numberGenomes - index;

    //     //TODO - improve rank
    //     col_node.rank = index + 1;

    //     col_node["Name"] = genomes_set[genome].label;

    //     if (genome_metadata.hasOwnProperty('isolation_country')) {
    //         col_node["Isolation Country"] = genome_metadata.isolation_country;
    //     } else {
    //         col_node["Isolation Country"] = "n/a"
    //     }

    //     if (genome_metadata.hasOwnProperty('host_name')) {
    //         col_node["Host Name"] = genome_metadata.host_name;
    //     } else {
    //         col_node["Host Name"] = "n/a"
    //     }

    //     if (genome_metadata.hasOwnProperty('genome_group')) {
    //         col_node["Genome Group"] = genome_metadata.genome_group;
    //     } else {
    //          col_node["Genome Group"] = "n/a"
    //     }

    //     //col_node["cat_0_index"] = index;

    //     clustergrammerdata.col_nodes.push(col_node);
    // }

    for (let i = 0, len = families.length; i < len; i++) {

        const family = families[i];
        var genomes_count = family.genomes;
        var mat = genomes_count.match(/.{1,2}/g);

        var isHex = false;
        for (let j = 0; j < mat.length; j++) {

            var regex = /[a-z]/i;
            this.isHex = regex.test(mat[j]);
            
            if (this.isHex) {
                //deal with base 16, convert all numbers to base 10 int
                mat[j] = parseInt(mat[j], 16);
                mat[j] = mat[j].toString();
                mat[j] = parseInt(mat[j], 10);
            } else {
                //string to int
                mat[j] = parseInt(mat[j], 10);
            }
        }

        clustergrammerdata.mat.push(mat);
    }

    console.log("Columns: " + clustergrammerdata.col_nodes.length);
    console.log("Rows: " + clustergrammerdata.row_nodes.length);

    console.log(`writing converted file to ${dataset}_clustergrammer.json`)
    fs.writeFileSync(`${dataset}_clustergrammer.json`, JSON.stringify(clustergrammerdata));
}