# Ecoli Data

## Data

Each datapoint contains:

1. Sequence Name: Accession number for the SWISS-PROT database
2. mcg: McGeoch's method for signal sequence recognition.
3. gvh: von Heijne's method for signal sequence recognition.
4. lip: von Heijne's Signal Peptidase II consensus sequence score. Binary
   attribute.
5. chg: Presence of charge on N-terminus of predicted lipoproteins. Binary
   attribute.
6. aac: score of discriminant analysis of the amino acid content of outer
   membrane and periplasmic proteins.
7. alm1: score of the ALOM membrane spanning region prediction program.
8. alm2: score of ALOM program after excluding putative cleavable signal regions
   from the sequence

## Objective

We must predict the sequence name from the 7 numerical values: mcg, gvh, lip,
chg, aac, alm1, alm2

## Testing

```bash
pip install -r requirements.txt
touca config set api-key=<TOUCA_API_KEY>
touca config set api-url=<TOUCA_API_URL>
touca test
```

Where options `api_key` and `api-url` are obtained from the Touca server. Click
[here](https://touca.io/docs/basics/account-setup) for step-by-step instructions
to create an account and obtain your API credentials.

Now when we make new codes changes to our software, we can continuously run our
Touca test to check how our software changes in behavior or performance.

```bash
touca test
```
