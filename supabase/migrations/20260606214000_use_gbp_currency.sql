-- Switch Personal Hub money values from Russian rubles to British pounds.

alter table public.transactions
  alter column currency set default 'GBP';

update public.transactions
set currency = 'GBP'
where currency = 'RUB';
