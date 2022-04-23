import json
import time
import boto3
import concurrent.futures

def get_prices_by_region(region):
    client = boto3.client('ec2', region_name=region)

    # Can also be achieved by calling client.describe_instance_types() and
    # manually paging using NextToken, but this is nicer
    paginator = client.get_paginator('describe_instance_types')
    instance_types = {entry['InstanceType']: entry
        for page in paginator.paginate() for entry in page['InstanceTypes']}

    paginator = client.get_paginator('describe_spot_price_history')
    now = time.time()
    response_iterator = paginator.paginate(
        StartTime=now,
        ProductDescriptions=['Linux/UNIX'])
    spot_prices = [spot_price for page in response_iterator
        for spot_price in page['SpotPriceHistory']]

    last_update_epoch_time_ms = round(now * 1000)
    stats = []
    for row in spot_prices:
        data = instance_types[row['InstanceType']]
        s = {
            'instance_type': row['InstanceType'],
            'dollars_per_hour': float(row['SpotPrice']),
            'region': region,
            'availability_zone': row['AvailabilityZone'],
            'current_generation': data['CurrentGeneration'],
            'architecture': ('arm64' if 'arm64' in
                data['ProcessorInfo']['SupportedArchitectures'] else 'x86_64'),
            'vcpus': data['VCpuInfo']['DefaultVCpus'],
            'memory_gib': data['MemoryInfo']['SizeInMiB'] / 1024.,
            'last_update_epoch_time_ms': last_update_epoch_time_ms
        }
        s['memory_gib_per_vcpu'] = s['memory_gib'] / s['vcpus']
        s['memory_gib_per_dollar'] = s['memory_gib'] / s['dollars_per_hour']
        s['vcpus_per_dollar'] = s['vcpus'] / s['dollars_per_hour']
        s['power'] = (0.036 * s['vcpus'] + 0.0034 * s['memory_gib'] +
            (0.2 if 'd' in s['instance_type'][2:].split('.')[0] else 0.0) +
            (0.3 if 'n' in s['instance_type'][2:].split('.')[0] else 0.0))
        for k, v in s.items():
             if isinstance(v, float):
                s[k] = round(v, 4)
        stats.append(s)
    return stats

def lambda_handler(event, context):
    client = boto3.client('ec2', region_name='us-west-1')
    regions = [x["RegionName"] for x in client.describe_regions()["Regions"]]
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        data = list(executor.map(get_prices_by_region, regions))
    data_list = []
    for d in data:
        data_list.extend(d)
    data_list.sort(key=lambda x: (x['dollars_per_hour'], -x['power']))
    json_data = json.dumps(data_list).encode(encoding='utf-8')

    s3_client = boto3.client('s3')
    s3_client.put_object(Body=json_data, Bucket='cpeccei-public',
        Key='spot_pricing_stats.json')
