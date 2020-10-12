library(tidyverse)
library(lubridate)

options(
    stringsAsFactors = FALSE,
    tibble.print_max = 200,
    tibble.print_min = 200
)

blue   <- "#4682b4"
red    <- "#d85c4f"
green  <- "#279e60"
orange <- "#e67e22"
pink   <- "#d64888"
purple <- "#9b5996"
yellow <- "#e1b405"
gray   <- "#95a5a6"
slate  <- "#54697e"

d <- read_tsv("../Desktop/logs.tsv")

valid_pages <- c(
    "/doublets/",
    "/icons/",
    "/diamonds/",
    "/artistmap/",
    "/ec2-datascience/",
    "/homeprice/",
    "/mosaic/",
    "/doublets-in-python/",
    "/textmining/",
    "/ec2-spot-pricing/",
    "/musicmap/",
    "/holmes/",
    "/zipmap/",
    "/ "
)


ds <- d %>%
    filter(url %in% valid_pages) %>%
    mutate(date = as.Date(time_utc)) %>%
    count(date, url)

ds %>%
    ggplot(aes(date, n, color = url)) + geom_line(size=2)

ds %>%
    ggplot(aes(date, n, fill = url)) + geom_col()

ds %>%
    mutate(date = format(date, "%m%d")) %>%
    pivot_wider(names_from = date, values_from = n)