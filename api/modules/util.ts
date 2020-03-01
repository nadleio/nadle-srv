export const structureError = (ctx, error) => {
  return `${ctx}-${error.message
    .hexEncode()
    .slice(-7)
    .toUpperCase()}`;
};

// Elastic Search
import elasticClient from "./elasticsearchClient";

const POST_INDEX = "post_index";

export const addSearchablePost = (id, title, body) => {
  return elasticClient.create({
    id: id,
    index: POST_INDEX,
    refresh: "true",
    body: {
      title: title,
      body: body
    }
  });
};

export const searchPost = (text, limit = 10, offset = 0) => {
  return elasticClient.search(
    {
      index: POST_INDEX,
      from: offset,
      size: limit,
      body: {
        query: {
          multi_match: {
            query: text,
            fields: ["title", "body"],
            fuzziness: "AUTO"
          }
        }
      }
    },
    {
      ignore: [404],
      maxRetries: 3
    },
    (err, result) => {
      if (err) console.log(err);
      return result;
    }
  );
};
