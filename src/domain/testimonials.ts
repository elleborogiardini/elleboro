export type TestimonialInput = {
  quote: string;
  author: string;
  context: string;
  visible: boolean;
  clientId?: string;
};

export type PublicTestimonial = {
  quote: string;
  author: string;
  context: string;
};

export function toPublicTestimonial(
  row: TestimonialInput,
): PublicTestimonial | null {
  if (!row.visible) return null;
  return {
    quote: row.quote,
    author: row.author,
    context: row.context,
  };
}
