CREATE table IF NOT EXISTS `tabs` (
  `uuid` varchar(256) NOT NULL,
  `title` varchar(256) NOT NULL,
  `progression` text NOT NULL,
   PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

