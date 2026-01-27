
/**
 * GET /api/user/role?userId=<uid>&workspaceId=<ws>
 * Returns:
 * - global role info (founder claim if you use it)
 * - workspace role (owner/admin/member/viewer) if workspaceId provided
 */





import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	// TODO: Implement actual logic
	res.status(200).json({ message: "OK" });
}





