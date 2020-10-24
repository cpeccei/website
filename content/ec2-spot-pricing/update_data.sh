#!/bin/bash

cd ~/repos/website/content/ec2-spot-pricing
~/ve_boto3/bin/python get_data.py
aws s3 cp stats.json s3://cpeccei-website-test/www/ec2-spot-pricing/