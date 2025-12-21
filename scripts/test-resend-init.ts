
import { Resend } from "resend";

try {
  console.log("Attempting to initialize Resend with undefined...");
  const resend = new Resend(undefined);
  console.log("Success!");
} catch (e) {
  console.error("Caught error:", e);
}
