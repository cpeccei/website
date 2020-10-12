import sys
import pathlib
import gzip
import re
import time

log_folder = sys.argv[1]
access_logs = pathlib.Path(log_folder).glob('access*')
print('time_utc', 'request_type', 'url', 'response', sep='\t')
for access_log in access_logs:
    opener = gzip.open if access_log.suffix == '.gz' else open
    with opener(access_log, 'rt') as f:
        for line in f:
            m = re.search(r'\[.*?\]', line)
            if m:
                time_str = m.group(0)
                time_struct = time.strptime(time_str, '[%d/%b/%Y:%H:%M:%S %z]')
                time_utc = time.strftime('%Y-%m-%d %H:%M:%S', time_struct)
            else:
                time_utc = ''
            m = re.search('"(GET|POST) (.*?) .*?" (\\d+) ', line)
            request_type = m.group(1) if m else ''
            url = m.group(2) if m else ''
            response = m.group(3) if m else ''
            print(time_utc, request_type, url, response, sep='\t')
