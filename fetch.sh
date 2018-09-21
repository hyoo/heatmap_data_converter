
curl -X POST -H 'Content-Type:application/solrquery+x-www-form-urlencoded' -H 'Accept:application/json' 'https://p3.theseed.org/services/data_api/genome/' -d 'q=genome_id:("1170703.3" OR "1171378.5" OR "1171378.3" OR "204722.22" OR "204722.5" OR "204722.15" OR "1160227.3" OR "1160232.3" OR "1160228.3" OR "1160233.3" OR "1160230.3" OR "1198683.3" OR "1198682.3" OR "1160229.3" OR "1169237.3" OR "1169236.3" OR "1169238.3" OR "1169239.3" OR "1169240.3" OR "1169241.3" OR "1169242.3" OR "1160231.3" OR "1169243.3" OR "1169244.3" OR "1210453.3" OR "1112912.3" OR "644346.3" OR "644346.4" OR "644346.5" OR "644346.6" OR "644346.7" OR "1004954.6" OR "1004954.3" OR "645170.29" OR "645170.30" OR "645170.31" OR "645170.27" OR "645170.28" OR "520487.6" OR "520488.3" OR "520488.4" OR "29461.52" OR "29461.54" OR "29461.11" OR "29461.12" OR "29461.8" OR "29461.21" OR "29461.7" OR "29461.9" OR "29461.10")&fl=genome_id,genome_name,host_name,isolation_country' > metadata.json


# curl -X POST -H 'Content-Type:application/jsonrpc+json' 'https://p3.theseed.org/services/data_api/' -d @req.micro.json > micro.json

# curl -X POST -H 'Content-Type:application/jsonrpc+json' 'https://p3.theseed.org/services/data_api/' -d @req.small.json > small.json

# curl -X POST -H 'Content-Type:application/jsonrpc+json' 'https://p3.theseed.org/services/data_api/' -d @req.medium.json > medium.json

# curl -X POST -H 'Content-Type:application/jsonrpc+json' 'https://p3.theseed.org/services/data_api/' -d @req.large.json > large.json
