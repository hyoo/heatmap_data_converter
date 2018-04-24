#!/usr/bin/env node

const fs = require('fs-extra')
const process = require('process')
const opts = require('commander')

if (require.main === module) {

    opts.option('-d, --dataset [value]', 'Dataset name: micro, small, medium, large')
    .option('-o, --output_format [value]', 'Output format: simple (default), meta')
    .parse(process.argv)

    if (!opts.dataset) {
        console.error('require dataset name')
        opts.help()
    }

    runConverter(opts.dataset, opts.output_format || 'simple')
}

function runConverter(dataset, output_format) {

    //dataset = micro, large, etc. 

    console.log(`dataset: ${dataset}, output: ${output_format}`)

    // make sure files are exit
    try {
        const has_reqeust_json = fs.statSync(`req.${dataset}.json`)
        const has_response_json = fs.statSync(`${dataset}.json`)
    } catch (ex) {
        console.log(ex.message)
    }
    debugger;
    const req_body = fs.readJsonSync(`req.${dataset}.json`, {encoding: 'utf8'})
    //const genomes_set = req_body.params[0].genomeFilterStatus

    //array of genomes "1004954.6", "520487.6", "29461.21"
    //const genomes = Object.keys(genomes_set)
    const genomes = req_body.params[0].genomeIds;
    //int
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
        row_node.clust = families.length - i;
        row_node.rank = i;
        //todo - determine rankvar better
        //row_node.rankvar = i + 1;
        row_node["cat-0"] = "FAMILY NAME: " + family.description;
        //todo - determine cat-o index better
        //row_node["cat_0_index"] = i;

        clustergrammerdata.row_nodes.push(row_node);
    }

    //const numberGenomes = Object.keys(genomes_set).length;
    console.log("number of genomes: " + total_genomes);

    for (var i = 0; i < genomes.length; i++) {
        var col_node = {};

        col_node.name = "Genome: " + genomes[i];
        //col_node.ini = numberGenomes - index;
        col_node.clust = total_genomes - i;
        col_node.rank = i;
        col_node["cat-0"] = "NAME " + genomes[i];
        clustergrammerdata.col_nodes.push(col_node);
    }

    // for (var genome in genomes_set) {
    //     var col_node = {};

    //     // console.log(genomes_set)
    //     // console.log(genome)
    //     var index = genomes_set[genome].index;
    //     // console.log("Index: " + index);
    //     // console.log(genomes_set[genome])
    //     // console.log('----------')

    //     col_node.name = "Genome: " + genome;
    //     //col_node.ini = numberGenomes - index;
    //     col_node.clust = numberGenomes - index;

    //     //TODO - improve rank
    //     col_node.rank = index;

    //     col_node["cat-0"] = "NAME " + genomes_set[genome].label;
    //     //col_node["cat_0_index"] = index;

    //     clustergrammerdata.col_nodes.push(col_node);
    // }

    for (let i = 0, len = families.length; i < len; i++) {
        const family = families[i];
        var genomes_count = family.genomes;
        var mat = genomes_count.match(/.{1,2}/g);
        // console.log("Mat: " + mat);

        clustergrammerdata.mat.push(mat);
    }

    console.log("Columns: " + clustergrammerdata.col_nodes.length);
    console.log("Rows: " + clustergrammerdata.row_nodes.length);

    console.log(`writing converted file to ${dataset}_clustergrammer.json`)
    fs.writeFileSync(`${dataset}_clustergrammer.json`, JSON.stringify(clustergrammerdata));
}