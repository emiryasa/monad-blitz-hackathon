const endpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) return Response.json({ error: "PINATA_JWT is not configured." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return Response.json({ error: "Upload an image smaller than 5 MB." }, { status: 400 });
  const payload = new FormData();
  payload.set("file", file);
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${jwt}` }, body: payload });
  if (!response.ok) return Response.json({ error: "Pinata image upload failed." }, { status: 502 });
  const { IpfsHash } = await response.json() as { IpfsHash: string };
  return Response.json({ data: { cid: IpfsHash, uri: `ipfs://${IpfsHash}` } }, { status: 201 });
}
