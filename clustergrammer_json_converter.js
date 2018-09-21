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
          //parse csv and account for possible parenteses inside double quotes
          var currentline=lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          currentline = currentline || [];
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
    // row_nodes and col_nodes objects are required to have three properties: name, clust, rank. name specifies
    // the name given to the row or column. clust and rank give the ordering of the row or column in the clustergram. Two
    // optional properties are group and value. group is an array that contains group-membership of the row/column
    // at different dendrogram distance cutoffs and is necessary for displaying a dendrogram. If nodes have the value
    // property, then semi-transparent bars will be made behind the labels to represent this value.

    //https://github.com/MaayanLab/clustergrammer-json/blob/master/clustergrammer_example.json

    // "name": "ATF7",
    // "clust": 67,
    // "rank": 66,

    //cat-x_index is used for sorting

    //build dictionary to sort through for indexing
    const rowFamilyIds = [];

    for (let i = 0, len = families.length; i < len; i++) {
        const family = families[i];
        rowFamilyIds.push(family.family_id)
    }

    rowFamilyIds.sort();
    const rowFamilyIdsDictionary = {};

    for (let i = 0, len = rowFamilyIds.length; i < len; i++) {
        rowFamilyIdsDictionary[rowFamilyIds[i]] = i;
    }

    var usedRowNames = {}

    for (let i = 0, len = families.length; i < len; i++) {
        const family = families[i];
        var row_node = {};
        
        //row name must be unique to render
        if (!usedRowNames.hasOwnProperty(family.description)) {
            usedRowNames[family.description] = 1
            row_node.name = family.description;
        } else {
            usedRowNames[family.description] += 1;
            row_node.name = family.description + " - " + usedRowNames[family.description]
        }
       
        //row_node.ini = families.length - i;
        row_node.clust = families.length - i + 1;
        row_node.rank = i + 1;
        //todo - determine rankvar better
        //row_node.rankvar = i + 1;
        row_node["cat-0"] = "FAMILY ID: " + family.family_id;
        row_node["cat_0_index"] = rowFamilyIdsDictionary[family.family_id];

        clustergrammerdata.row_nodes.push(row_node);
    }

    const numberGenomes = Object.keys(genomes_set).length;

    const colName = [];
    const colIsolationCountry = [];
    const colHostName = [];
    const colGenomeGroup = [];
    //const colGenomeId = [];

    for (var genome in genomes_set) {
        colName.push(genomes_set[genome].label);

        var that = this;

        for (var i = 0; i < genomes_metadata.length; i++) {

            //randomize stubbed data for now
            //Math.random() * (max - min) + min
            var min = Math.ceil(0);
            var max = Math.floor(3);
            var randomNumber = Math.floor(Math.random() * (max - min)) + min; 

            genomes_metadata[i].genome_group = randomNumber;
            var genome_data = genomes_metadata[i];
                        
            if (genome_data.genome_id === genome) {

                //need all properties for indexing purposes
                if (!genome_data.hasOwnProperty('isolation_country')) {
                    genome_data.isolation_country = "n/a"
                } 

                if (!genome_data.hasOwnProperty('host_name')) {
                    genome_data.host_name = "n/a"
                } 

                if (!genome_data.hasOwnProperty('genome_group')) {
                    genome_data.genome_group = "n/a"
                } 

                that.genome_metadata = genome_data;
                break;
            }
        }

        colIsolationCountry.push(that.genome_metadata.isolation_country);
        colHostName.push(that.genome_metadata.host_name);
        colGenomeGroup.push(that.genome_metadata.genome_group);

        //colGenomeId.push(genome);

    }

    colName.sort();
    colIsolationCountry.sort();
    colHostName.sort();
    colGenomeGroup.sort();
    //colGenomeId.sort();

    //want array to be opposite of alphabetiacl because clustergrammer places 0 index to the right - we want alphabetical to move left to right
    colName.reverse();
    colIsolationCountry.reverse();
    colHostName.reverse();
    colGenomeGroup.reverse();
    //colGenomeId.reverse();

    const colNameDictionary = {};
    const colIsolationCountryDictionary = {};
    const colHostNameDictionary = {};
    const colGenomeGroupDictionary = {};
    //const colGenomeIdDictionary = {};

    for (let i = 0, len = colName.length; i < len; i++) {
        var data = {};
        data.baseIndex = i;
        data.counter = 1;
        colNameDictionary[colName[i]] = data;
    }

    for (let i = 0, len = colIsolationCountry.length; i < len; i++) {
        var data = {};
        data.baseIndex = i;
        data.counter = 1;
        colIsolationCountryDictionary[colIsolationCountry[i]] = data;
    }

    for (let i = 0, len = colHostName.length; i < len; i++) {
        var data = {};
        data.baseIndex = i;
        data.counter = 1;
        colHostNameDictionary[colHostName[i]] = data;
    }

    for (let i = 0, len = colGenomeGroup.length; i < len; i++) {
        var data = {};
        data.baseIndex = i;
        data.counter = 1;
        colGenomeGroupDictionary[colGenomeGroup[i]] = data;
    }

    // for (let i = 0, len = colGenomeId.length; i < len; i++) {
    //     var data = {};
    //     data.baseIndex = i;
    //     data.counter = 1;
    //     colGenomeIdDictionary[colGenomeId[i]] = data;
    // }

    var usedColNames = {}

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

        //name must be unique or will not render
        if (!usedColNames.hasOwnProperty(genomes_set[genome].label)) {
            usedColNames[genomes_set[genome].label] = 1
            col_node.name = genomes_set[genome].label;
        } else {
            usedColNames[genomes_set[genome].label] += 1;
            col_node.name = genomes_set[genome].label + " - " + usedColNames[genomes_set[genome].label]
        }

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

        // col_node["cat-4"] = "Genome ID: " + genome;

        col_node["cat_0_index"] = colNameDictionary[genomes_set[genome].label].baseIndex - colNameDictionary[genomes_set[genome].label].counter;
        col_node["cat_1_index"] = colIsolationCountryDictionary[that.genome_metadata.isolation_country].baseIndex - colIsolationCountryDictionary[that.genome_metadata.isolation_country].counter;
        col_node["cat_2_index"] = colHostNameDictionary[that.genome_metadata.host_name].baseIndex - colHostNameDictionary[that.genome_metadata.host_name].counter;
        col_node["cat_3_index"] = colGenomeGroupDictionary[that.genome_metadata.genome_group].baseIndex - colGenomeGroupDictionary[that.genome_metadata.genome_group].counter;
        // col_node["cat_4_index"] = colGenomeIdDictionary[genome].baseIndex - colGenomeIdDictionary[genome].counter;

        colNameDictionary[genomes_set[genome].label].counter += 1;
        colIsolationCountryDictionary[that.genome_metadata.isolation_country].counter += 1;
        colHostNameDictionary[that.genome_metadata.host_name].counter += 1;
        colGenomeGroupDictionary[that.genome_metadata.genome_group].counter += 1;
        //colGenomeIdDictionary[genome].counter += 1;

        clustergrammerdata.col_nodes.push(col_node);
    }

    console.log(colNameDictionary)

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