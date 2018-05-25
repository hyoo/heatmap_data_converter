curl -X POST -H 'Content-Type:application/solrquery+x-www-form-urlencoded' -H 'Accept:application/json' 'https://p3.theseed.org/services/data_api/genome/' -d 'q=genome_id:("1171378.5" OR "1112912.3" OR "1004954.6" OR "645170.30" OR "645170.27" OR "645170.28" OR "520487.6" OR "29461.52" OR "29461.54" OR "29461.21")&fl=genome_id,genome_name,host_name,isolation_country' > metadata.json

