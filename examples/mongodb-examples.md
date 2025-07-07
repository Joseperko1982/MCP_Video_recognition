# MongoDB Integration Examples

## Direct MongoDB Queries

You can query the MongoDB database directly to retrieve stored media and analysis results.

### Connect to MongoDB

Using MongoDB Compass or the MongoDB shell:
```
mongodb+srv://joseperko1982:SFfgjMDQX8FMkGwK@joeexexassitant.rhr3hwx.mongodb.net/Joeexexassitant
```

### Example Queries

#### Find all analyzed videos:
```javascript
db.media.find({ mimeType: /^video\// }).limit(10)
```

#### Find media by URL:
```javascript
db.media.findOne({ url: "https://example.com/video.mp4" })
```

#### Search analysis results by text:
```javascript
db.media.find({ $text: { $search: "cat playing" } })
```

#### Get analysis statistics:
```javascript
db.media.aggregate([
  {
    $group: {
      _id: "$mimeType",
      count: { $sum: 1 },
      totalSize: { $sum: "$fileSize" },
      avgSize: { $avg: "$fileSize" }
    }
  }
])
```

#### Find recently analyzed media:
```javascript
db.media.find().sort({ uploadedAt: -1 }).limit(10)
```

## Usage Examples

### Analyze a video from URL:
```bash
# Using the MCP tool
{
  "name": "video_recognition",
  "arguments": {
    "url": "https://example.com/sample-video.mp4",
    "prompt": "Describe the main events in this video"
  }
}
```

### Analyze an image from URL:
```bash
{
  "name": "image_recognition",
  "arguments": {
    "url": "https://example.com/image.jpg",
    "prompt": "What objects are in this image?"
  }
}
```

Note: All media and analysis results are automatically saved to MongoDB.

## Security Note

Remember to:
1. Keep your MongoDB credentials secure in the .env file
2. Never commit .env files to version control
3. Use MongoDB Atlas IP whitelist for production
4. Consider using read-only users for queries