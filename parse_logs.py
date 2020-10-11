import sys
import pathlib
import gzip
import re
import time

log_folder = sys.argv[1]
access_logs = pathlib.Path(log_folder).glob('access*')
for access_log in access_logs:
    opener = gzip.open if access_log.suffix == '.gz' else open
    with opener(access_log, 'rt') as f:
        for line in f:
            time_str = re.search(r'\[.*?\]', line).group(0)
            time_struct = time.strptime(time_str, '[%d/%b/%Y:%H:%M:%S %z]')
            fmt_time = time.strftime('%Y-%m-%d %H:%M:%S', time_struct)
            print(fmt_time)
